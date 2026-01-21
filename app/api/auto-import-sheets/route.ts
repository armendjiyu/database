import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRODUCTS = [
  {
    name: "Toner Pads 1 Pack",
    tableName: "toner_1pack_daily",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8V0d5kbxQQjTeR4gQsYE7PzfZUMLXlRxdsKKwDzYG0CNZgoQh_tySjKOGIfjU60LpqG7IqzeZEAgl/pub?output=csv&gid=490405517",
    filterPack: "1 Pack"
  },
  {
    name: "Toner Pads 2 Pack",
    tableName: "toner_2pack_daily",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8V0d5kbxQQjTeR4gQsYE7PzfZUMLXlRxdsKKwDzYG0CNZgoQh_tySjKOGIfjU60LpqG7IqzeZEAgl/pub?output=csv&gid=1956528015"
  },
  {
    name: "Toner Pads 3 Pack",
    tableName: "toner_3pack_daily",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8V0d5kbxQQjTeR4gQsYE7PzfZUMLXlRxdsKKwDzYG0CNZgoQh_tySjKOGIfjU60LpqG7IqzeZEAgl/pub?output=csv&gid=1204450464"
  },
  {
    name: "NAD+ Cream",
    tableName: "nad_cream_daily",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8V0d5kbxQQjTeR4gQsYE7PzfZUMLXlRxdsKKwDzYG0CNZgoQh_tySjKOGIfjU60LpqG7IqzeZEAgl/pub?output=csv&gid=897107571"
  },
  {
    name: "Toner & NAD+ Bundle",
    tableName: "toner_nad_bundle_daily",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8V0d5kbxQQjTeR4gQsYE7PzfZUMLXlRxdsKKwDzYG0CNZgoQh_tySjKOGIfjU60LpqG7IqzeZEAgl/pub?output=csv&gid=266030251"
  }
]

function parseDate(dateStr: string): Date {
  const [day, month] = dateStr.split("-")
  const monthMap: { [key: string]: number } = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  }
  const monthNum = monthMap[month]
  
  // December = 2025, January onwards = 2026
  const year = monthNum === 11 ? 2025 : 2026
  
  const date = new Date(year, monthNum, parseInt(day))
  return date
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

function parseCSV(csvText: string, productName: string) {
  const lines = csvText.split("\n").filter(line => line.trim())
  const dates: Date[] = []
  const metrics: Array<{ name: string; values: number[] }> = []
  
  console.log(`[v0] Parsing CSV for ${productName} with ${lines.length} lines`)
  
  // Find header row with dates (should be "Seller SKU" row)
  let dateRowIndex = -1
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const cells = parseCSVLine(lines[i])
    if (cells[1]?.trim() === "Seller SKU" && cells[2]?.match(/\d{1,2}-[A-Za-z]{3}/)) {
      dateRowIndex = i
      console.log(`[v0] Found date row at index ${i}`)
      break
    }
  }
  
  if (dateRowIndex === -1) {
    console.log("[v0] Could not find date row")
    return { dates, metrics }
  }
  
  // Parse dates from the date row (starting at column 2, index 2)
  const dateCells = parseCSVLine(lines[dateRowIndex])
  for (let i = 2; i < dateCells.length; i++) {
    const cell = dateCells[i]?.trim()
    if (cell && cell.match(/\d{1,2}-[A-Za-z]{3}/)) {
      try {
        const parsedDate = parseDate(cell)
        dates.push(parsedDate)
      } catch (e) {
        console.error("[v0] Failed to parse date:", cell)
      }
    }
  }
  
  console.log(`[v0] Parsed ${dates.length} dates`)
  
  // Detect which product type based on structure
  // 1 Pack has different row numbers than 2 Pack/3 Pack/NAD+/Bundle
  const is1Pack = productName.includes("1 Pack") || productName === "Toner Pads"
  
  // Row mappings (0-indexed, relative to CSV)
  // Dates are at row 4 (index 4), so data starts at index dateRowIndex
  const rowMap = is1Pack ? {
    "Items Sold": dateRowIndex + 1,      // C6: row 5
    "GMV": dateRowIndex + 8,              // C13: row 12
    "Orders": dateRowIndex + 13,          // C18: row 17
    "AOV": dateRowIndex + 14,             // C19: row 18
    "Units per Order": dateRowIndex + 15, // C20: row 19
    "Product Impressions": dateRowIndex + 17, // C22: row 21
    "Page Views": dateRowIndex + 18,      // C23: row 22
    "Click-through Rate": dateRowIndex + 19, // C24: row 23
    "Avg Visitors": dateRowIndex + 21,    // C26: row 25
    "Avg. Customers": dateRowIndex + 22,  // C27: row 26
    "Conv. Rate": dateRowIndex + 23,      // C28: row 27
    "$ per Visitor": dateRowIndex + 26,   // C31: row 30
    "$ per Customer": dateRowIndex + 27,  // C32: row 31
    "Subscribers": dateRowIndex + 29,     // C34: row 33
  } : {
    "Items Sold": dateRowIndex + 1,      // C6: row 5
    "GMV": dateRowIndex + 6,              // C11: row 10
    "Orders": dateRowIndex + 9,           // C14: row 13
    "AOV": dateRowIndex + 10,             // C15: row 14
    "Units per Order": dateRowIndex + 11, // C16: row 15
    "Product Impressions": dateRowIndex + 13, // C18: row 17
    "Page Views": dateRowIndex + 14,      // C19: row 18
    "Click-through Rate": dateRowIndex + 15, // C20: row 19
    "Avg Visitors": dateRowIndex + 17,    // C22: row 21
    "Avg. Customers": dateRowIndex + 18,  // C23: row 22
    "Conv. Rate": dateRowIndex + 19,      // C24: row 23
    "$ per Visitor": dateRowIndex + 22,   // C27: row 26
    "$ per Customer": dateRowIndex + 23,  // C28: row 27
    "Subscribers": dateRowIndex + 25,     // C30: row 29
  }
  
  // Extract metrics from specific rows
  for (const [metricName, rowIndex] of Object.entries(rowMap)) {
    if (rowIndex >= lines.length) continue
    
    const cells = parseCSVLine(lines[rowIndex])
    const values: number[] = []
    
    // Data starts at column 2 (index 2)
    for (let j = 2; j < cells.length && (j - 2) < dates.length; j++) {
      const value = cells[j]?.trim().replace(/[",]/g, "") || ""
      const num = parseFloat(value.replace(/[$%]/g, ""))
      values.push(isNaN(num) ? 0 : num)
    }
    
    if (values.length > 0) {
      metrics.push({ name: metricName, values })
      console.log(`[v0] Captured ${metricName} from row ${rowIndex}: [${values.slice(0, 3).join(", ")}...]`)
    }
  }
  
  return { dates, metrics }
}

export async function POST() {
  try {
    const results = []
    
    for (const product of PRODUCTS) {
      console.log(`[v0] Importing ${product.name}...`)
      
      let response = await fetch(product.csvUrl, { 
        cache: "no-store",
        redirect: "manual",
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      })
      
      // Handle 307 redirects manually
      if (response.status === 307) {
        const htmlText = await response.text()
        // Extract redirect URL from HTML
        const match = htmlText.match(/HREF="([^"]+)"/)
        if (match && match[1]) {
          const redirectUrl = match[1].replace(/&amp;/g, '&')
          console.log(`[v0] Following redirect to: ${redirectUrl}`)
          response = await fetch(redirectUrl, {
            cache: "no-store",
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          })
        }
      }
      
      console.log(`[v0] Final response status: ${response.status}`)
      
      const csvText = await response.text()
      
      console.log(`[v0] CSV length: ${csvText.length}, starts with: ${csvText.substring(0, 50)}`)
      
      // Verify we got CSV
      if (csvText.trim().startsWith("<")) {
        console.error(`[v0] Still got HTML for ${product.name}`)
        results.push({ product: product.name, status: "error", error: "Failed to get CSV after redirect" })
        continue
      }
      
      const { dates, metrics } = parseCSV(csvText, product.name)
      console.log(`[v0] Found ${dates.length} dates and ${metrics.length} metrics for ${product.name}`)
      
      // Transform metrics into daily rows
      const dailyData = []
      
      for (let dateIndex = 0; dateIndex < dates.length; dateIndex++) {
        const date = dates[dateIndex].toISOString().split("T")[0]
        const row: any = { date }
        
        // Map metric names to column names
        for (const metric of metrics) {
          const value = metric.values[dateIndex]
          if (value === undefined) continue
          
          const metricLower = metric.name.toLowerCase()
          if (metricLower === "gmv") row.gmv = value
          else if (metricLower === "items sold") row.items_sold = value
          else if (metricLower === "orders") row.orders = value
          else if (metricLower === "aov") row.aov = value
          else if (metricLower === "units per order") row.units_per_order = value
          else if (metricLower === "product impressions") row.product_impressions = value
          else if (metricLower === "page views") row.page_views = value
          else if (metricLower === "click-through rate") row.click_through_rate = value
          else if (metricLower === "visitors") row.visitors = value
          else if (metricLower === "avg visitors") row.visitors = value
          else if (metricLower === "avg. customers") row.customers = value
          else if (metricLower === "conv. rate") row.conversion_rate = value
          else if (metricLower === "$ per visitor") row.dollar_per_visitor = value
          else if (metricLower === "$ per customer") row.dollar_per_customer = value
          else if (metricLower === "subscribers") row.subscribers = value
        }
        
        dailyData.push(row)
      }
      
      console.log(`[v0] Prepared ${dailyData.length} daily records for ${product.name}`)
      
      if (dailyData.length > 0) {
        const { data, error } = await supabase
          .from(product.tableName)
          .upsert(dailyData, { 
            onConflict: "date",
            ignoreDuplicates: false 
          })
        
        if (error) {
          console.error(`[v0] Error importing ${product.name}:`, error)
          results.push({ product: product.name, status: "error", error: error.message })
        } else {
          console.log(`[v0] Successfully imported ${dailyData.length} daily records for ${product.name}`)
          results.push({ product: product.name, status: "success", records: dailyData.length })
        }
      } else {
        results.push({ product: product.name, status: "warning", message: "No data to import" })
      }
    }
    
    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("[v0] Auto-import error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
