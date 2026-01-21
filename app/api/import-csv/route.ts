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

function parseCSVLine(line: string): string[] {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csvData, productName } = body

    if (!csvData || !productName) {
      return NextResponse.json(
        { error: "Missing CSV data or product name" },
        { status: 400 }
      )
    }

    const tableName = TABLE_MAP[productName]
    if (!tableName) {
      return NextResponse.json(
        { error: "Unknown product" },
        { status: 400 }
      )
    }

    const lines = csvData.split("\n").filter((line: string) => line.trim())
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have at least a header row and one data row" },
        { status: 400 }
      )
    }

    const headers = parseCSVLine(lines[0]).map((h: string) => h.toLowerCase())
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: any = {}
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j]
        const value = values[j]?.trim()
        
        if (!value || value === "") continue
        
        if (header === "date") {
          row.date = value
        } else if (header === "gmv") {
          row.gmv = parseFloat(value)
        } else if (header === "items sold") {
          row.items_sold = parseFloat(value)
        } else if (header === "orders") {
          row.orders = parseFloat(value)
        } else if (header === "aov") {
          row.aov = parseFloat(value)
        } else if (header === "units per order") {
          row.units_per_order = parseFloat(value)
        } else if (header === "product impressions") {
          row.product_impressions = parseFloat(value)
        } else if (header === "page views") {
          row.page_views = parseFloat(value)
        } else if (header === "click-through rate") {
          row.click_through_rate = parseFloat(value)
        } else if (header === "visitors") {
          row.visitors = parseFloat(value)
        } else if (header === "customers") {
          row.customers = parseFloat(value)
        } else if (header === "conv. rate") {
          row.conversion_rate = parseFloat(value)
        } else if (header === "$ per visitor") {
          row.dollar_per_visitor = parseFloat(value)
        } else if (header === "$ per customer") {
          row.dollar_per_customer = parseFloat(value)
        } else if (header === "subscribers") {
          row.subscribers = parseFloat(value)
        }
      }
      
      if (row.date) {
        rows.push(row)
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid data rows found" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from(tableName)
      .upsert(rows, {
        onConflict: "date",
        ignoreDuplicates: false
      })

    if (error) {
      console.error("[v0] Supabase import error:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: rows.length
    })
  } catch (error) {
    console.error("[v0] CSV import error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
