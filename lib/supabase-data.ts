import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TABLE_MAP: Record<string, string> = {
  "Toner Pads 1 Pack": "toner_1pack_daily",
  "Toner Pads 2 Pack": "toner_2pack_daily",
  "Toner Pads 3 Pack": "toner_3pack_daily",
  "NAD+ Cream": "nad_cream_daily",
  "Toner & NAD+ Bundle": "toner_nad_bundle_daily"
}

export interface DailyMetrics {
  date: string
  gmv?: number
  items_sold?: number
  orders?: number
  aov?: number
  units_per_order?: number
  product_impressions?: number
  page_views?: number
  click_through_rate?: number
  visitors?: number
  customers?: number
  conversion_rate?: number
  dollar_per_visitor?: number
  dollar_per_customer?: number
  subscribers?: number
}

export async function fetchProductData(productName: string): Promise<DailyMetrics[]> {
  const tableName = TABLE_MAP[productName]
  
  if (!tableName) {
    throw new Error(`Unknown product: ${productName}`)
  }

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order("date", { ascending: true })

  if (error) {
    console.error("[v0] Supabase error:", error)
    throw new Error(`Failed to fetch data: ${error.message}`)
  }

  return data || []
}

export function getTableName(productName: string): string {
  return TABLE_MAP[productName] || ""
}
