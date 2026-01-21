import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TABLE_MAP: Record<string, string> = {
  "Toner Pads 1 Pack": "toner_1pack_daily",
  "Toner Pads 2 Pack": "toner_2pack_daily",
  "Toner Pads 3 Pack": "toner_3pack_daily",
  "NAD+ Cream": "nad_cream_daily",
  "Toner & NAD+ Bundle": "toner_nad_bundle_daily"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_name, date, metrics } = body

    if (!product_name || !date || !metrics) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const tableName = TABLE_MAP[product_name]
    if (!tableName) {
      return NextResponse.json(
        { error: "Unknown product" },
        { status: 400 }
      )
    }

    // Prepare row data
    const rowData: any = { date }
    
    // Map metric names to column names
    Object.entries(metrics).forEach(([metricName, value]) => {
      const metricLower = metricName.toLowerCase()
      if (metricLower === "gmv") rowData.gmv = value
      else if (metricLower === "items sold") rowData.items_sold = value
      else if (metricLower === "orders") rowData.orders = value
      else if (metricLower === "aov") rowData.aov = value
      else if (metricLower === "units per order") rowData.units_per_order = value
      else if (metricLower === "product impressions") rowData.product_impressions = value
      else if (metricLower === "page views") rowData.page_views = value
      else if (metricLower === "click-through rate") rowData.click_through_rate = value
      else if (metricLower === "avg visitors") rowData.visitors = value
      else if (metricLower === "avg. customers") rowData.customers = value
      else if (metricLower === "conv. rate") rowData.conversion_rate = value
      else if (metricLower === "$ per visitor") rowData.dollar_per_visitor = value
      else if (metricLower === "$ per customer") rowData.dollar_per_customer = value
      else if (metricLower === "subscribers") rowData.subscribers = value
    })

    // Insert data into Supabase
    const { data, error } = await supabase
      .from(tableName)
      .upsert(rowData, {
        onConflict: "date",
        ignoreDuplicates: false
      })

    if (error) {
      console.error("[v0] Supabase insert error:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Data added successfully"
    })
  } catch (error) {
    console.error("[v0] Add metric error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
