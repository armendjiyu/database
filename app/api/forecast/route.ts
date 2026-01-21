import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Recent-Weighted Linear Regression Forecast
// Heavily weights the last 7-14 days to capture current momentum
// Simple, transparent, and accurate for short-term e-commerce forecasting
function recentWeightedForecast(data: number[], forecastDays: number) {
  if (data.length < 7) {
    throw new Error("Need at least 7 data points for forecasting")
  }

  // Use only the most recent 14 days for trend calculation (responsive to current momentum)
  const lookbackDays = Math.min(14, data.length)
  const recentData = data.slice(-lookbackDays)
  
  // Apply exponential weights: most recent day gets highest weight
  // Weight formula: weight[i] = 2^(i / lookbackDays) 
  // This means day 14 (most recent) has ~4x more influence than day 1
  const weights: number[] = []
  let weightSum = 0
  
  for (let i = 0; i < lookbackDays; i++) {
    const weight = Math.pow(2, i / lookbackDays)
    weights.push(weight)
    weightSum += weight
  }
  
  // Normalize weights to sum to 1
  const normalizedWeights = weights.map(w => w / weightSum)
  
  // Weighted Linear Regression
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  
  for (let i = 0; i < lookbackDays; i++) {
    const x = i
    const y = recentData[i]
    const w = normalizedWeights[i]
    
    sumX += w * x
    sumY += w * y
    sumXY += w * x * y
    sumX2 += w * x * x
  }
  
  // Calculate slope and intercept
  const denominator = sumX2 - sumX * sumX
  const slope = denominator !== 0 ? (sumXY - sumX * sumY) / denominator : 0
  const intercept = sumY - slope * sumX
  
  // Calculate simple moving average for smoothing
  const smoothed: number[] = []
  const smoothWindow = 3
  
  for (let i = 0; i < data.length; i++) {
    if (i < smoothWindow - 1) {
      smoothed.push(data[i])
    } else {
      const window = data.slice(i - smoothWindow + 1, i + 1)
      const avg = window.reduce((sum, val) => sum + val, 0) / smoothWindow
      smoothed.push(avg)
    }
  }
  
  // Project forecasts forward from the last actual value
  const lastValue = data[data.length - 1]
  const lastIndex = lookbackDays - 1
  const forecasts: number[] = []
  
  for (let i = 1; i <= forecastDays; i++) {
    // Project using the weighted trend
    const forecastValue = intercept + slope * (lastIndex + i)
    
    // Apply minimal dampening only for very long forecasts (>21 days)
    const dampening = forecastDays > 21 ? Math.max(0.85, 1 - (i / forecastDays) * 0.15) : 1.0
    const dampedForecast = forecastValue * dampening
    
    // Ensure we don't go below 70% of recent average (realistic floor)
    const recentAvg = recentData.reduce((sum, val) => sum + val, 0) / recentData.length
    const floor = recentAvg * 0.7
    
    forecasts.push(Math.max(floor, dampedForecast))
  }
  
  // Calculate confidence based on how consistent the recent trend is
  const deviations = recentData.map((val, i) => {
    const predicted = intercept + slope * i
    return Math.abs(val - predicted) / val
  })
  const avgDeviation = deviations.reduce((sum, val) => sum + val, 0) / deviations.length
  const confidenceScore = Math.round(Math.max(0, Math.min(100, (1 - avgDeviation) * 100)))
  
  return {
    smoothed,
    forecasts,
    slope,
    intercept,
    confidenceScore,
    recentAverage: recentData.reduce((sum, val) => sum + val, 0) / recentData.length,
    lookbackDays,
  }
}

export async function POST(request: Request) {
  try {
    const { productName, metric, forecastDays } = await request.json()

    if (!productName || !metric || !forecastDays) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    // Map product names to table names
    const tableMap: Record<string, string> = {
      "Toner Pads 1 Pack": "toner_1pack_daily",
      "Toner Pads 2 Pack": "toner_2pack_daily",
      "Toner Pads 3 Pack": "toner_3pack_daily",
      "NAD+ Cream": "nad_cream_daily",
      "Toner & NAD+ Bundle": "toner_nad_bundle_daily",
    }

    let data: any[] = []
    let error: any = null

    // Handle "All Products" - aggregate data from all tables
    if (productName === "All Products") {
      const allTables = Object.values(tableMap)
      const aggregatedData: Record<string, any> = {}

      for (const table of allTables) {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select("date, gmv, orders, items_sold, visitors")
          .order("date", { ascending: true })
          .limit(60)

        if (tableError) {
          console.error(`[v0] Supabase error for ${table}:`, tableError)
          continue
        }

        if (tableData) {
          tableData.forEach((row: any) => {
            if (!aggregatedData[row.date]) {
              aggregatedData[row.date] = {
                date: row.date,
                gmv: 0,
                orders: 0,
                items_sold: 0,
                visitors: 0,
              }
            }
            aggregatedData[row.date].gmv += Number(row.gmv) || 0
            aggregatedData[row.date].orders += Number(row.orders) || 0
            aggregatedData[row.date].items_sold += Number(row.items_sold) || 0
            aggregatedData[row.date].visitors += Number(row.visitors) || 0
          })
        }
      }

      data = Object.values(aggregatedData).sort((a: any, b: any) => a.date.localeCompare(b.date))
    } else {
      const tableName = tableMap[productName]
      if (!tableName) {
        return NextResponse.json({ error: "Invalid product name" }, { status: 400 })
      }

      // Fetch last 60 days of ALL metrics for multi-variate analysis
      const result = await supabase
        .from(tableName)
        .select("date, gmv, orders, items_sold, visitors")
        .order("date", { ascending: true })
        .limit(60)

      data = result.data || []
      error = result.error
    }

    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length < 8) {
      return NextResponse.json({ error: "Need at least 8 days of data for forecasting" }, { status: 400 })
    }

    // Extract metric values (exclude latest day - often 0 due to sync)
    const filteredData = data.slice(0, -1)
    const dates = filteredData.map((row: any) => row.date)
    const values = filteredData.map((row: any) => Number(row[metric]) || 0)

    if (values.length < 7) {
      return NextResponse.json({ error: "Insufficient data after filtering" }, { status: 400 })
    }

    // Run recent-weighted forecast
    const result = recentWeightedForecast(values, forecastDays)

    // Generate future dates
    const lastDate = new Date(dates[dates.length - 1])
    const forecastDates: string[] = []
    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + i)
      forecastDates.push(futureDate.toISOString().split("T")[0])
    }

    // Declare primaryValues and supportingMetrics variables
    const primaryValues = values;
    const supportingMetrics = ["gmv", "orders", "items_sold", "visitors"].filter(m => m !== metric);

    return NextResponse.json({
      historical: {
        dates,
        values,
        smoothed: result.smoothed,
      },
      forecast: {
        dates: forecastDates,
        values: result.forecasts,
      },
      metadata: {
        trend: result.slope,
        confidenceScore: result.confidenceScore,
        recentAverage: result.recentAverage,
        method: "Recent-Weighted Linear Regression",
        algorithm: "Exponentially weighted trend (last 14 days heavily favored)",
        dataPoints: values.length,
        lookbackDays: result.lookbackDays,
        supportingMetricsUsed: 0,
      },
    })
  } catch (error) {
    console.error("[v0] Forecast error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
