"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts"
import { createBrowserClient } from "@supabase/ssr"

const PRODUCTS = [
  { name: "Toner 1-Pack", table: "toner_1pack_daily", color: "#1a5c3f" },
  { name: "Toner 2-Pack", table: "toner_2pack_daily", color: "#2d7a54" },
  { name: "Toner 3-Pack", table: "toner_3pack_daily", color: "#41976a" },
  { name: "NAD+ Cream", table: "nad_cream_daily", color: "#6bb591" },
  { name: "Bundle", table: "toner_nad_bundle_daily", color: "#95d3b8" }
]

const METRICS = [
  { value: "gmv", label: "GMV (Revenue)" },
  { value: "orders", label: "Orders" },
  { value: "items_sold", label: "Items Sold" },
  { value: "visitors", label: "Visitors" }
]

// Custom tooltip with proper background
const CustomTooltip = ({ active, payload, label, selectedMetric }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-card border border-border rounded-md shadow-lg p-3 min-w-[160px]">
      <p className="text-foreground font-semibold text-xs mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-xs font-medium text-foreground">
              {selectedMetric === 'gmv' ? `$${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Custom label to show total above bar
const TotalLabel = (props: any) => {
  const { x, y, width, value, payload, selectedMetric } = props
  
  if (!payload) return null
  
  // Calculate total from all product values in the data point
  const total = PRODUCTS.reduce((sum, product) => {
    const val = payload[product.name]
    return sum + (typeof val === 'number' ? val : 0)
  }, 0)
  
  if (total === 0) return null
  
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="var(--color-foreground)"
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
    >
      {selectedMetric === 'gmv' ? `$${total.toLocaleString()}` : total.toLocaleString()}
    </text>
  )
}

export function ProductsHeatmap() {
  const [selectedMetric, setSelectedMetric] = useState("gmv")
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily")
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null)
  const availableDates = [
    "2023-10-01",
    "2023-10-02",
    "2023-10-03",
    "2023-10-04",
    "2023-10-05",
    "2023-10-06",
    "2023-10-07"
  ]

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const limit = viewMode === "daily" ? 14 : 56 // 14 days or 8 weeks (56 days)
      const allData: Record<string, any> = {}
      
      // Fetch data for each product
      for (const product of PRODUCTS) {
        const { data, error } = await supabase
          .from(product.table)
          .select("date, gmv, orders, items_sold, visitors")
          .order("date", { ascending: false })
          .limit(limit)

        if (data && !error) {
          if (viewMode === "daily") {
            // Daily view - just reverse to chronological order
            data.reverse().forEach((row: any) => {
              if (!allData[row.date]) {
                allData[row.date] = { date: row.date }
              }
              allData[row.date][product.name] = row[selectedMetric] || 0
            })
          } else {
            // Weekly view - aggregate by week
            data.reverse()
            const weeklyData: Record<string, any[]> = {}
            
            data.forEach((row: any) => {
              const date = new Date(row.date)
              const weekStart = new Date(date)
              weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
              const weekKey = weekStart.toISOString().split('T')[0]
              
              if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = []
              }
              weeklyData[weekKey].push(row[selectedMetric] || 0)
            })
            
            // Aggregate weekly totals
            Object.entries(weeklyData).forEach(([weekKey, values]) => {
              if (!allData[weekKey]) {
                allData[weekKey] = { date: weekKey }
              }
              allData[weekKey][product.name] = values.reduce((sum, val) => sum + val, 0)
            })
          }
        }
      }

      const formattedData = Object.entries(allData)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .slice(-( viewMode === "daily" ? 14 : 8)) // Keep only last 14 days or 8 weeks
        .map(([_, item]: any) => ({
          ...item,
          date: viewMode === "daily" 
            ? new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : `Week of ${new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        }))

      setChartData(formattedData)
      setLoading(false)
    }

    fetchData()
  }, [selectedMetric, viewMode])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>All Products Overview</CardTitle>
            <CardDescription>
              {viewMode === "daily" ? "Last 14 days" : "Last 8 weeks"} - Hover over legend to isolate
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "daily" ? "default" : "ghost"}
                size="sm"
                className="h-9 rounded-r-none text-xs"
                onClick={() => setViewMode("daily")}
              >
                14 Days
              </Button>
              <Button
                variant={viewMode === "weekly" ? "default" : "ghost"}
                size="sm"
                className="h-9 rounded-l-none text-xs"
                onClick={() => setViewMode("weekly")}
              >
                8 Weeks
              </Button>
            </div>
            
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map((metric) => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div>
            {/* Total Metric Display */}
            <div className="mb-6 flex items-center justify-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg">
                <div className="text-center">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Total {METRICS.find(m => m.value === selectedMetric)?.label}
                  </div>
                  <div className="text-3xl font-bold text-foreground tracking-tight">
                    {selectedMetric === 'gmv' ? '$' : ''}
                    {chartData.reduce((sum, day) => {
                      const dayTotal = PRODUCTS.reduce((daySum, product) => 
                        daySum + (day[product.name] || 0), 0)
                      return sum + dayTotal
                    }, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {viewMode === "daily" ? "Last 14 days" : "Last 8 weeks"} across all products
                  </div>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--color-foreground)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="var(--color-foreground)"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip selectedMetric={selectedMetric} />} />
                <Legend 
                  onMouseEnter={(e) => setHoveredProduct(e.value)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  wrapperStyle={{ cursor: "pointer" }}
                />
                {PRODUCTS.map((product, index) => (
                  <Bar
                    key={product.name}
                    dataKey={product.name}
                    stackId="a"
                    fill={product.color}
                    opacity={hoveredProduct === null || hoveredProduct === product.name ? 1 : 0.2}
                  >
                    {/* Always show total label on the last (top) bar */}
                    {index === PRODUCTS.length - 1 && (
                      <LabelList content={<TotalLabel selectedMetric={selectedMetric} />} />
                    )}
                    {/* Show individual product value when hovered */}
                    {hoveredProduct === product.name && (
                      <LabelList
                        position="center"
                        formatter={(value: number) => 
                          selectedMetric === 'gmv' ? `$${value.toLocaleString()}` : value.toLocaleString()
                        }
                        fill="white"
                        fontSize={11}
                        fontWeight={600}
                      />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
