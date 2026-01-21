export interface MetricData {
  name: string
  values: { date: string; value: number }[]
}

export interface DashboardData {
  name: string
  metrics: MetricData[]
}

export interface WeekData {
  total: number
  average: number
  dailyValues: { date: string; value: number }[]
}

export interface MetricAnalysis {
  name: string
  currentWeek: WeekData
  previousWeek: WeekData
  change: number
  changePercent: number
  trend: "up" | "down" | "flat"
  median: number
  aboveMedian: boolean
  useAverage: boolean
}

export function parseCSVData(csvText: string, sheetName: string, filterPack?: string): DashboardData {
  const lines = csvText.trim().split("\n")
  const metrics: MetricData[] = []
  const seenMetrics = new Set<string>() // Track which metrics we've already parsed

  if (lines.length === 0) {
    return { name: sheetName, metrics: [] }
  }

  // Find header row with dates
  let headerRowIndex = -1
  let dateColumns: { index: number; date: string }[] = []

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const cells = parseCsvLine(lines[i])

    // Look for date patterns in the row
    const dates = cells
      .map((cell, idx) => ({ index: idx, date: cell }))
      .filter(({ date }) => {
        return /\d+-\w+|\d+\/\d+\/\d+|\d+-\d+-\d+|\w+\s+\d+/.test(date)
      })

    if (dates.length > 5) {
      headerRowIndex = i
      dateColumns = dates
      console.log("[v0] Found header row at index:", i, "with", dates.length, "dates")
      console.log("[v0] First date:", dates[0]?.date, "Last date:", dates[dates.length - 1]?.date)
      break
    }
  }

  if (headerRowIndex === -1 || dateColumns.length === 0) {
    console.log("[v0] No header row found")
    return { name: sheetName, metrics: [] }
  }

  let currentCategory = ""
  const capturedCategories = new Set<string>() // Track which categories have captured their first product

  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])

    if (cells.every((cell) => !cell || cell === "")) continue

    const firstCell = (cells[0] || "").trim()
    const secondCell = (cells[1] || "").trim()

    const categoryNames = ["Items Sold", "GMV"]
    const cellText = firstCell || secondCell

    if (categoryNames.includes(cellText)) {
      currentCategory = cellText
      console.log("[v0] Found category:", currentCategory)
      continue
    }

    // Skip header rows like "Seller SKU"
    if (cellText.toLowerCase().includes("seller") || cellText.toLowerCase().includes("sku")) {
      continue
    }

    const metricName = secondCell || firstCell

    if (!metricName || metricName.toLowerCase().includes("total")) continue

    const isInItemsSoldOrGMVCategory = currentCategory === "Items Sold" || currentCategory === "GMV"

    const isTargetPack = !filterPack || metricName === filterPack

    const isFirstProductInCategory =
      isInItemsSoldOrGMVCategory &&
      !capturedCategories.has(currentCategory) &&
      isTargetPack &&
      dateColumns.some(({ index }) => {
        const val = cells[index]
        return val && !isNaN(Number.parseFloat(val.replace(/[$,%]/g, "").trim()))
      })

    const isGeneralMetric = [
      "Orders",
      "Product Impressions",
      "Page Views",
      "Avg Visitors",
      "$ per Visitor",
      "$ per Customer",
      "Avg. Customers",
      "Subscribers",
      "Conv. Rate",
      "Click-through Rate",
      "AOV",
      "Units per Order",
    ].includes(metricName)

    if (!isFirstProductInCategory && !isGeneralMetric) {
      continue
    }

    const fullMetricName = isFirstProductInCategory ? currentCategory : metricName

    if (seenMetrics.has(fullMetricName)) {
      console.log("[v0] Skipping duplicate metric:", fullMetricName)
      continue
    }

    const values: { date: string; value: number }[] = []

    for (const { index, date } of dateColumns) {
      if (index >= cells.length) continue

      const valueStr = cells[index]
      if (!valueStr) continue

      const cleanValue = valueStr.replace(/[$,%]/g, "").trim()
      const numValue = Number.parseFloat(cleanValue)

      if (!isNaN(numValue)) {
        values.push({ date, value: numValue })
      }
    }

    if (values.length > 0) {
      console.log("[v0] Found metric:", fullMetricName, "with", values.length, "values")
      seenMetrics.add(fullMetricName) // Mark this metric as seen
      if (isFirstProductInCategory) {
        capturedCategories.add(currentCategory) // Mark this specific category as captured
      }
      metrics.push({
        name: fullMetricName,
        values,
      })
    }
  }

  console.log("[v0] Parsed metrics:", metrics.length)
  return { name: sheetName, metrics }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

export function getWeekOverWeekData(metrics: MetricData[]): MetricAnalysis[] {
  return metrics.map((metric) => {
    const allValues = metric.values.map((v) => v.value)

    const averageMetrics = [
      "$ per visitor",
      "$ per customer",
      "conv. rate",
      "click-through rate",
      "units per order",
      "aov",
      "avg visitors",
      "avg. customers",
    ]
    const useAverage = averageMetrics.some((m) => metric.name.toLowerCase().includes(m))

    const allData = metric.values
    const totalDays = allData.length

    // Calculate how many days to use for each period (half of total data, minimum 7 days)
    const daysPerPeriod = Math.max(7, Math.floor(totalDays / 2))

    // Get the most recent data for current period and previous period
    const currentWeekData = allData.slice(-daysPerPeriod)
    const previousWeekData = allData.slice(-daysPerPeriod * 2, -daysPerPeriod)

    if (currentWeekData.length === 0) {
      return {
        name: metric.name,
        currentWeek: { total: 0, average: 0, dailyValues: [] },
        previousWeek: { total: 0, average: 0, dailyValues: [] },
        change: 0,
        changePercent: 0,
        trend: "flat" as const,
        median: calculateMedian(allValues),
        aboveMedian: false,
        useAverage,
      }
    }

    const previousWeekTotal = previousWeekData.reduce((sum, v) => sum + v.value, 0)
    const currentWeekTotal = currentWeekData.reduce((sum, v) => sum + v.value, 0)

    const previousWeekAvg = previousWeekData.length > 0 ? previousWeekTotal / previousWeekData.length : 0
    const currentWeekAvg = currentWeekData.length > 0 ? currentWeekTotal / currentWeekData.length : 0

    const previousValue = useAverage ? previousWeekAvg : previousWeekTotal
    const currentValue = useAverage ? currentWeekAvg : currentWeekTotal

    const change = currentValue - previousValue
    const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0

    const median = calculateMedian(allValues)

    return {
      name: metric.name,
      currentWeek: {
        total: currentWeekTotal,
        average: currentWeekAvg,
        dailyValues: currentWeekData,
      },
      previousWeek: {
        total: previousWeekTotal,
        average: previousWeekAvg,
        dailyValues: previousWeekData,
      },
      change,
      changePercent,
      trend: Math.abs(changePercent) < 1 ? "flat" : change > 0 ? "up" : "down",
      median,
      aboveMedian: currentWeekAvg >= median,
      useAverage,
    }
  })
}

export function getWeekOverWeekDataForDateRange(metrics: MetricData[], endDate: Date, days = 7): MetricAnalysis[] {
  return metrics.map((metric) => {
    const allValues = metric.values.map((v) => v.value)

    const averageMetrics = [
      "$ per visitor",
      "$ per customer",
      "conv. rate",
      "click-through rate",
      "units per order",
      "aov",
      "avg visitors",
      "avg. customers",
    ]
    const useAverage = averageMetrics.some((m) => metric.name.toLowerCase().includes(m))

    // Parse dates and find data for the selected period
    const endTime = endDate.getTime()
    const startTime = endTime - days * 24 * 60 * 60 * 1000
    const previousStartTime = startTime - days * 24 * 60 * 60 * 1000

    const currentPeriodData = metric.values.filter((v) => {
      const date = parseDate(v.date)
      const time = date.getTime()
      return time >= startTime && time <= endTime
    })

    const previousPeriodData = metric.values.filter((v) => {
      const date = parseDate(v.date)
      const time = date.getTime()
      return time >= previousStartTime && time < startTime
    })

    const previousTotal = previousPeriodData.reduce((sum, v) => sum + v.value, 0)
    const currentTotal = currentPeriodData.reduce((sum, v) => sum + v.value, 0)

    const previousAvg = previousPeriodData.length > 0 ? previousTotal / previousPeriodData.length : 0
    const currentAvg = currentPeriodData.length > 0 ? currentTotal / currentPeriodData.length : 0

    const previousValue = useAverage ? previousAvg : previousTotal
    const currentValue = useAverage ? currentAvg : currentTotal

    const change = currentValue - previousValue
    const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0

    const median = calculateMedian(allValues)

    return {
      name: metric.name,
      currentWeek: {
        total: currentTotal,
        average: currentAvg,
        dailyValues: currentPeriodData,
      },
      previousWeek: {
        total: previousTotal,
        average: previousAvg,
        dailyValues: previousPeriodData,
      },
      change,
      changePercent,
      trend: Math.abs(changePercent) < 1 ? "flat" : change > 0 ? "up" : "down",
      median,
      aboveMedian: currentAvg >= median,
      useAverage,
    }
  })
}

function parseDate(dateStr: string): Date {
  if (/\d+-\w+/.test(dateStr)) {
    const [day, month] = dateStr.split("-")
    const monthMap: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    }
    const monthNum = monthMap[month] ?? 0
    const dayNum = Number.parseInt(day)

    // Use current year and let JavaScript handle date parsing naturally
    const currentYear = new Date().getFullYear()
    const date = new Date(currentYear, monthNum, dayNum)

    // If the date is in the future, use previous year
    const now = new Date()
    if (date > now) {
      date.setFullYear(currentYear - 1)
    }

    return date
  }

  // Fallback to default parsing
  return new Date(dateStr)
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}
