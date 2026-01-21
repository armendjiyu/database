import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const PRODUCT_MAP: Record<string, { name: string; table: string }> = {
  "1729597548586176631": { name: "Toner Pads 1 Pack", table: "toner_1pack_daily" },
  "1732136029558182007": { name: "Toner & NAD+ Bundle", table: "toner_nad_bundle_daily" },
  "1731190899772395639": { name: "Toner Pads 2 Pack", table: "toner_2pack_daily" },
  "1731857251405893751": { name: "Toner Pads 3 Pack", table: "toner_3pack_daily" },
  "1731931607460515959": { name: "NAD+ Cream", table: "nad_cream_daily" },
}

export async function POST(request: Request) {
  try {
    const { data } = await request.json()

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Group by product table
    const grouped: Record<string, any[]> = {}

    for (const item of data) {
      const product = PRODUCT_MAP[item.productId]
      if (!product) continue

      const tableName = product.table

      if (!grouped[tableName]) {
        grouped[tableName] = []
      }

      // Calculate all formulas similar to Google Sheet
      const gmv = Number(item.gmv) || 0
      const orders = Number(item.orders) || 0
      const items_sold = Number(item.items_sold) || 0
      const visitors = Number(item.visitors) || 0
      const customers = Number(item.customers) || 0
      const product_impressions = Number(item.product_impressions) || 0
      const page_views = Number(item.page_views) || 0
      const subscribers = Number(item.subscribers) || 0

      // Formulas from sheet
      const conversion_rate = visitors > 0 ? (orders / visitors) * 100 : 0
      const aov = orders > 0 ? gmv / orders : 0
      const units_per_order = orders > 0 ? items_sold / orders : 0
      const click_through_rate = product_impressions > 0 ? (page_views / product_impressions) * 100 : 0
      const dollar_per_visitor = visitors > 0 ? gmv / visitors : 0
      const dollar_per_customer = customers > 0 ? gmv / customers : 0

      grouped[tableName].push({
        date: item.date,
        gmv,
        orders,
        items_sold,
        visitors,
        customers,
        subscribers,
        product_impressions,
        page_views,
        conversion_rate,
        aov,
        units_per_order,
        click_through_rate,
        dollar_per_visitor,
        dollar_per_customer,
      })
    }

    let totalCount = 0
    const productCount = Object.keys(grouped).length

    // Insert data for each product table
    for (const [tableName, rows] of Object.entries(grouped)) {
      console.log(`[v0] Importing to ${tableName}:`, rows.length, "rows")
      console.log(`[v0] Sample row:`, rows[0])

      const { error } = await supabase.from(tableName).upsert(rows, {
        onConflict: "date",
        ignoreDuplicates: false,
      })

      if (error) {
        console.error(`[v0] Error inserting into ${tableName}:`, error)
        return NextResponse.json({ error: `Failed to import data for ${tableName}: ${error.message}` }, { status: 500 })
      }

      totalCount += rows.length
      console.log(`[v0] Successfully imported ${rows.length} rows into ${tableName}`)
    }

    return NextResponse.json({ 
      success: true, 
      count: totalCount,
      products: productCount,
    })
  } catch (error) {
    console.error("[v0] Import error:", error)
    return NextResponse.json({ error: "Failed to import data" }, { status: 500 })
  }
}
