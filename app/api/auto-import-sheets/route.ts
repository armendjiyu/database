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

function parseCSV(csvText: string, filterPack?: string) {
  const lines = csvText.split("\n").filter(line => line.trim())
  const dates: Date[] = []
  const metrics: Array<{ name: string; values: number[] }> = []
  
  console.log(`[v0] Parsing CSV with ${lines.length} lines`)
  
  // Find header row with dates
  let headerRowIndex = -1
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const cells = parseCSVLine(lines[i])
    console.log(`[v0] Row ${i}: ${cells.length} cells, first 3: [${cells.slice(0, 3).join(", ")}]`)
    
    // Look for a row with many cells where cell 1 or later contains a date pattern
    if (cells.length > 10) {
      for (let j = 1; j < Math.min(5, cells.length); j++) {
        if (cells[j]?.includes("-") && cells[j].match(/\d{1,2}-[A-Za-z]{3}/)) {
          headerRowIndex = i
          console.log(`[v0] Found date pattern at row ${i}, column ${j}: ${cells[j]}`)
          break
        }
      }
      if (headerRowIndex !== -1) break
    }
  }
  
  if (headerRowIndex === -1) {
    console.log("[v0] Could not find header row with dates")
    console.log("[v0] First 5 lines of CSV:")
    lines.slice(0, 5).forEach((line, i) => {
      console.log(`[v0] Line ${i}: ${line.substring(0, 100)}`)
    })
    return { dates, metrics }
  }
  
  console.log(`[v0] Found header row at index: ${headerRowIndex}`)
  
  // Parse dates from header
  const headerCells = parseCSVLine(lines[headerRowIndex])
  for (let i = 1; i < headerCells.length; i++) {
    const cell = headerCells[i].trim()
    if (cell && cell.includes("-")) {
      try {
        const parsedDate = parseDate(cell)
        dates.push(parsedDate)
      } catch (e) {
        console.error("[v0] Failed to parse date:", cell)
      }
    }
  }
  
  console.log(`[v0] Parsed ${dates.length} dates from ${headerCells[1]} to ${headerCells[dates.length]}`)
  
  // Parse metrics
  let currentCategory = ""
  const capturedCategories = new Set<string>()
  
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i])
    const firstCell = cells[0]?.trim() || ""
    const secondCell = cells[1]?.trim() || ""
    
    console.log(`[v0] Metric row ${i}: firstCell="${firstCell}", secondCell="${secondCell}", cells=${cells.length}`)
    
    // Check if this is a category header (in second column)
    if (secondCell === "Items Sold" || secondCell === "GMV") {
      currentCategory = secondCell
      console.log(`[v0] Found category: ${currentCategory}`)
      continue
    }
    
    // Skip header rows
    if (secondCell === "Seller SKU" || (firstCell === "" && secondCell === "")) continue
    
    // Check if this is a pack variant under a category (data is in column 2)
    if (currentCategory && (secondCell === "1 Pack" || secondCell === "2 Pack" || secondCell === "3 Pack")) {
      if (filterPack && secondCell !== filterPack) {
        currentCategory = "" // Reset category if not matching
        continue
      }
      if (capturedCategories.has(currentCategory)) {
        currentCategory = "" // Reset after capturing
        continue
      }
      
      const metricName = currentCategory
      capturedCategories.add(currentCategory)
      currentCategory = "" // Reset category after capturing
      
      const values: number[] = []
      for (let j = 2; j < cells.length && (j - 2) < dates.length; j++) {
        const value = cells[j]?.trim().replace(/[",]/g, "") || ""
        const num = parseFloat(value.replace(/[$]/g, ""))
        values.push(isNaN(num) ? 0 : num)
      }
      
      metrics.push({ name: metricName, values })
      console.log(`[v0] Found metric: ${metricName} with ${values.length} values (from category)`)
      continue
    }
    
    // If we have a category and the next row is a product name (not a pack), capture it
    if (currentCategory && secondCell && !secondCell.includes("Pack") && !secondCell.includes("SKU") && 
        !secondCell.includes("Items Sold") && !secondCell.includes("GMV") && !secondCell.includes("Orders") &&
        !capturedCategories.has(currentCategory)) {
      const metricName = currentCategory
      capturedCategories.add(currentCategory)
      currentCategory = "" // Reset category after capturing
      
      const values: number[] = []
      for (let j = 2; j < cells.length && (j - 2) < dates.length; j++) {
        const value = cells[j]?.trim().replace(/[",]/g, "") || ""
        const num = parseFloat(value.replace(/[$]/g, ""))
        values.push(isNaN(num) ? 0 : num)
      }
      
      if (values.some(v => v !== 0)) {
        metrics.push({ name: metricName, values })
        console.log(`[v0] Found metric: ${metricName} with ${values.length} values (from category - product row)`)
      }
      continue
    }
    
    // Regular metric row (metric name in column 2, data starts at column 3)
    if (secondCell && !secondCell.includes("Pack") && !secondCell.includes("SKU") && 
        !secondCell.includes("Items Sold") && !secondCell.includes("GMV") && cells.length > 10) {
      const metricName = secondCell
      const values: number[] = []
      
      for (let j = 2; j < cells.length && (j - 2) < dates.length; j++) {
        const value = cells[j]?.trim().replace(/[",]/g, "") || ""
        const num = parseFloat(value.replace(/[$%]/g, ""))
        values.push(isNaN(num) ? 0 : num)
      }
      
      if (values.some(v => v !== 0)) {
        metrics.push({ name: metricName, values })
        console.log(`[v0] Found metric: ${metricName} with ${values.length} values (regular)`)
      }
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
      
      const { dates, metrics } = parseCSV(csvText, product.filterPack)
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
