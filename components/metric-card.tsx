"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"
import type { MetricAnalysis } from "@/lib/data-processor"

interface MetricCardProps {
  metric: MetricAnalysis
}

export function MetricCard({ metric }: MetricCardProps) {
  const { name, currentWeek, previousWeek, change, changePercent, trend, aboveMedian } = metric

  const formatValue = (value: number) => {
    if (name.toLowerCase().includes("gmv") || name.toLowerCase().includes("$")) {
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    }
    if (name.toLowerCase().includes("rate") || name.toLowerCase().includes("%")) {
      return `${value.toFixed(2)}%`
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{formatValue(currentWeek)}</div>
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span>{Math.abs(changePercent).toFixed(1)}%</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">vs {formatValue(previousWeek)}</span>
          <span
            className={`font-medium ${aboveMedian ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {aboveMedian ? "Above" : "Below"} 50th %ile
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
