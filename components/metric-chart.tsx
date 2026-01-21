"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import type { MetricAnalysis } from "@/lib/data-processor"

interface MetricChartProps {
  metric: MetricAnalysis
}

export function MetricChart({ metric }: MetricChartProps) {
  const chartConfig = {
    value: {
      label: metric.name,
      color: "hsl(var(--chart-1))",
    },
    median: {
      label: "50th Percentile",
      color: "hsl(var(--chart-3))",
    },
  }

  const formatValue = (value: number) => {
    if (metric.name.toLowerCase().includes("gmv") || metric.name.toLowerCase().includes("$")) {
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    }
    if (metric.name.toLowerCase().includes("rate") || metric.name.toLowerCase().includes("%")) {
      return `${value.toFixed(2)}%`
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  return (
    <ChartContainer config={chartConfig} className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={metric.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
          <YAxis
            className="text-xs"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              if (metric.name.toLowerCase().includes("gmv") || metric.name.toLowerCase().includes("$")) {
                return `$${(value / 1000).toFixed(0)}k`
              }
              return value.toFixed(0)
            }}
          />
          <ChartTooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{payload[0].payload.date}</span>
                      </div>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs font-medium">{entry.name}:</span>
                          </div>
                          <span className="text-xs font-bold">{formatValue(Number(entry.value))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={false}
            name={metric.name}
          />
          <Line
            type="monotone"
            dataKey="median"
            stroke="var(--color-median)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            name="50th Percentile"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
