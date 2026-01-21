"use client"

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"
import type { MetricAnalysis } from "@/lib/data-processor"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useState } from "react"

interface MetricOverviewProps {
  metric: MetricAnalysis
}

export function MetricOverview({ metric }: MetricOverviewProps) {
  const { name, currentWeek, previousWeek, change, changePercent, trend, aboveMedian, useAverage } = metric
  const [hoveredLine, setHoveredLine] = useState<"current" | "previous" | null>(null)

  const formatValue = (value: number, showDecimals = false) => {
    if (name.toLowerCase().includes("gmv") || name.toLowerCase().includes("$")) {
      // Show decimals for $ per visitor and $ per customer
      if (name.toLowerCase().includes("per")) {
        return `$${value.toFixed(2)}`
      }
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    }
    if (name.toLowerCase().includes("rate") || name.toLowerCase().includes("%")) {
      return `${value.toFixed(2)}%`
    }
    // Show decimals for AOV and Units per Order
    if (name.toLowerCase().includes("aov") || name.toLowerCase().includes("units per order")) {
      return value.toFixed(2)
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  const TrendIcon = trend === "up" ? ArrowUpIcon : trend === "down" ? ArrowDownIcon : MinusIcon
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground"

  const chartData = currentWeek.dailyValues.map((curr, i) => {
    const prev = previousWeek.dailyValues[i]
    return {
      day: i + 1,
      currentDate: curr.date,
      previousDate: prev?.date || "",
      currentWeek: curr.value,
      previousWeek: prev?.value || null,
    }
  })

  return (
    <div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">{name}</CardTitle>
          <span
            className={`text-xs px-2 py-1 rounded-full ${aboveMedian ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
          >
            {aboveMedian ? "Above" : "Below"} Median
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Week {useAverage ? "Average" : "Total"}</p>
            <p className="text-2xl font-bold">
              {formatValue(useAverage ? currentWeek.average : currentWeek.total, true)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Previous Week {useAverage ? "Average" : "Total"}</p>
            <p className="text-xl font-semibold text-muted-foreground">
              {formatValue(useAverage ? previousWeek.average : previousWeek.total, true)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">Week-over-Week Change</span>
          <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span>
              {changePercent > 0 ? "+" : ""}
              {changePercent.toFixed(1)}%
            </span>
            <span className="text-xs">({formatValue(change, true)})</span>
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground mb-2">Week-over-Week Comparison</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              onMouseLeave={() => setHoveredLine(null)}
            >
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10 }}
                label={{ value: "Day", position: "insideBottom", offset: -5, fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} width={45} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null

                  const data = payload[0].payload
                  const currentValue = data.currentWeek
                  const previousValue = data.previousWeek

                  // Use the hovered line state to determine which data to show
                  if (hoveredLine === "current" && currentValue !== null) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-lg">
                        <p className="text-xs font-semibold mb-1" style={{ color: "#ef4444" }}>
                          Current Week
                        </p>
                        <p className="text-xs text-muted-foreground">{data.currentDate}</p>
                        <p className="text-sm font-bold mt-1">{formatValue(Number(currentValue), true)}</p>
                      </div>
                    )
                  }

                  if (hoveredLine === "previous" && previousValue !== null) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-lg">
                        <p className="text-xs font-semibold mb-1" style={{ color: "#3b82f6" }}>
                          Previous Week
                        </p>
                        <p className="text-xs text-muted-foreground">{data.previousDate}</p>
                        <p className="text-sm font-bold mt-1">{formatValue(Number(previousValue), true)}</p>
                      </div>
                    )
                  }

                  // Default to current week if no specific hover detected
                  if (currentValue !== null) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-lg">
                        <p className="text-xs font-semibold mb-1" style={{ color: "#ef4444" }}>
                          Current Week
                        </p>
                        <p className="text-xs text-muted-foreground">{data.currentDate}</p>
                        <p className="text-sm font-bold mt-1">{formatValue(Number(currentValue), true)}</p>
                      </div>
                    )
                  }

                  return null
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                iconType="line"
                formatter={(value) => (value === "previousWeek" ? "Previous Week" : "Current Week")}
              />
              <Line
                type="monotone"
                dataKey="previousWeek"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6, onMouseEnter: () => setHoveredLine("previous") }}
                connectNulls={false}
                onMouseEnter={() => setHoveredLine("previous")}
              />
              <Line
                type="monotone"
                dataKey="currentWeek"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#ef4444" }}
                activeDot={{ r: 6, onMouseEnter: () => setHoveredLine("current") }}
                onMouseEnter={() => setHoveredLine("current")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="border-t pt-3">
          <p className="text-xs font-semibold mb-2">Daily Values - Current Week</p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {currentWeek.dailyValues.map((day, i) => (
              <div key={i} className="text-xs">
                <p className="text-muted-foreground mb-1">{day.date}</p>
                <p className="font-medium">{formatValue(day.value, true)}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </div>
  )
}
