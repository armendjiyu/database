"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ComposedChart, Line, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid, ReferenceLine } from "recharts"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

const PRODUCTS = [
  { name: "All Products (Combined)", value: "All Products" },
  { name: "Toner Pads 1 Pack", value: "Toner Pads 1 Pack" },
  { name: "Toner Pads 2 Pack", value: "Toner Pads 2 Pack" },
  { name: "Toner Pads 3 Pack", value: "Toner Pads 3 Pack" },
  { name: "NAD+ Cream", value: "NAD+ Cream" },
  { name: "Toner & NAD+ Bundle", value: "Toner & NAD+ Bundle" },
]

const METRICS = [
  { value: "gmv", label: "GMV (Revenue)", format: (v: number) => `$${v.toFixed(0)}` },
  { value: "orders", label: "Orders", format: (v: number) => v.toFixed(0) },
  { value: "items_sold", label: "Items Sold", format: (v: number) => v.toFixed(0) },
  { value: "visitors", label: "Visitors", format: (v: number) => v.toFixed(0) },
]

const FORECAST_DAYS = [
  { value: "7", label: "7 Days" },
]

interface ForecastData {
  historical: {
    dates: string[]
    values: number[]
    smoothed: number[]
  }
  forecast: {
    dates: string[]
    values: number[]
  }
  metadata: {
    trend: number
    lastLevel: number
    method: string
  }
}

export function ForecastChart() {
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [selectedMetric, setSelectedMetric] = useState<string>("gmv")
  const [forecastDays, setForecastDays] = useState<string>("14")
  const [loading, setLoading] = useState(false)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateForecast = async () => {
    if (!selectedProduct) {
      setError("Please select a product")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: selectedProduct,
          metric: selectedMetric,
          forecastDays: Number.parseInt(forecastDays),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate forecast")
      }

      const data = await response.json()
      setForecastData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const chartData = forecastData
    ? [
        ...forecastData.historical.dates.map((date, i) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          historical: forecastData.historical.values[i],
          smoothed: forecastData.historical.smoothed[i],
          forecast: null,
        })),
        ...forecastData.forecast.dates.map((date, i) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          historical: null,
          smoothed: i === 0 ? forecastData.historical.smoothed[forecastData.historical.smoothed.length - 1] : null,
          forecast: forecastData.forecast.values[i],
        })),
      ]
    : []

  const selectedMetricConfig = METRICS.find((m) => m.value === selectedMetric)
  const trendDirection = forecastData && forecastData.metadata.trend > 0 ? "up" : "down"
  const avgForecast = forecastData
    ? forecastData.forecast.values.reduce((a, b) => a + b, 0) / forecastData.forecast.values.length
    : 0

  return (
    <div className="space-y-6">
      {/* How It Works Card */}
      <Card className="bg-gradient-to-r from-blue-500/5 to-transparent border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            How Forecasting Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold mb-1">Algorithm: Recent-Weighted Linear Regression</h4>
            <p className="text-sm text-muted-foreground">
              This system uses exponential weighting to heavily favor your most recent performance when predicting the future:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-card rounded-md border">
              <div className="text-xs font-semibold text-primary mb-1">1. Recent Focus</div>
              <p className="text-xs text-muted-foreground">
                Analyzes only the last 14 days. The most recent day has 4x more influence than day 1 (exponential weighting)
              </p>
            </div>
            
            <div className="p-3 bg-card rounded-md border">
              <div className="text-xs font-semibold text-primary mb-1">2. Momentum Detection</div>
              <p className="text-xs text-muted-foreground">
                Calculates your current growth/decline rate using weighted linear regression on recent performance
              </p>
            </div>
            
            <div className="p-3 bg-card rounded-md border">
              <div className="text-xs font-semibold text-primary mb-1">3. Forward Projection</div>
              <p className="text-xs text-muted-foreground">
                Projects the detected trend forward with minimal dampening to maintain momentum accuracy
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <div className="flex items-start gap-2">
              <div className="text-amber-600 font-bold text-sm mt-0.5">⚠️</div>
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">Important Limitations</p>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Forecasts are <strong>statistical estimates</strong>, not guarantees. Accuracy decreases for longer periods (30+ days). 
                  External factors (marketing campaigns, seasonality, market changes) are not accounted for. 
                  Use forecasts as a <strong>guide</strong>, not absolute truth. Always combine with business judgment.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Configuration</CardTitle>
          <CardDescription>Select product and parameters to generate data-driven predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((product) => (
                    <SelectItem key={product.value} value={product.value}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Forecast Period</label>
              <Select value={forecastDays} onValueChange={setForecastDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORECAST_DAYS.map((days) => (
                    <SelectItem key={days.value} value={days.value}>
                      {days.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleGenerateForecast} disabled={loading || !selectedProduct} className="w-full">
                {loading ? "Generating..." : "Generate Forecast"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast Stats */}
      {forecastData && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg">
            <div className="text-center">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Avg Forecast
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">
                {selectedMetricConfig?.format(avgForecast)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Next {forecastDays} days
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-lg">
            <div className="text-center">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Trend
              </div>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground tracking-tight">
                {trendDirection === "up" ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
                {Math.abs(forecastData.metadata.trend).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {trendDirection === "up" ? "Positive" : "Negative"}
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-lg">
            <div className="text-center">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Confidence Score
              </div>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground tracking-tight">
                {forecastData.metadata.confidenceScore}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {forecastData.metadata.confidenceScore >= 70 ? "High" : forecastData.metadata.confidenceScore >= 50 ? "Medium" : "Low"} Reliability
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 rounded-lg">
            <div className="text-center">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Data Points
              </div>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground tracking-tight">
                {forecastData.metadata.dataPoints}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                + {forecastData.metadata.supportingMetricsUsed} metrics analyzed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Chart */}
      {forecastData && (
        <Card>
          <CardHeader>
            <CardTitle>Forecast Visualization</CardTitle>
            <CardDescription>
              Historical data (blue), smoothed trend (purple dashed), and {forecastDays}-day forecast (green area) for {selectedProduct}. 
              Confidence: {forecastData.metadata.confidenceScore}% based on {forecastData.metadata.dataPoints} days of data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={500}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--foreground))"
                  fontSize={11}
                />
                <YAxis 
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    return (
                      <div className="rounded-lg border border-border bg-card p-3 shadow-xl max-w-xs backdrop-blur-sm">
                        <p className="text-xs font-semibold mb-2">{payload[0].payload.date}</p>
                        {payload.map((entry: any, i: number) => (
                          <div key={i} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-xs text-muted-foreground capitalize">{entry.name}</span>
                            </div>
                            <span className="text-xs font-medium text-foreground">
                              {entry.value ? selectedMetricConfig?.format(entry.value) : "N/A"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend 
                  formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  wrapperStyle={{ paddingTop: "20px" }}
                />
                
                {/* Reference line to separate historical from forecast */}
                <ReferenceLine 
                  x={chartData[forecastData.historical.dates.length - 1]?.date} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3"
                  label={{ value: "Forecast Start", position: "top", fontSize: 10 }}
                />
                
                {/* Historical actual data */}
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#3b82f6" }}
                  connectNulls={false}
                />
                
                {/* Smoothed trend line */}
                <Line
                  type="monotone"
                  dataKey="smoothed"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
                
                {/* Forecast */}
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#forecastGradient)"
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!forecastData && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[500px] text-center">
            <Activity className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ready to Forecast</h3>
            <p className="text-muted-foreground max-w-md">
              Select a product, metric, and forecast period above to generate data-driven predictions. 
              The algorithm heavily weights your most recent performance to capture current momentum.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
