"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { UnifiedMetricChart } from "@/components/unified-metric-chart"
import { parseCSVData, getWeekOverWeekData, type MetricAnalysis, type MetricData } from "@/lib/data-processor"

interface SheetDashboardProps {
  csvUrl: string
  sheetName: string
  filterPack?: string // Add optional filter for specific pack variant (e.g., "1 Pack")
  productImageUrl?: string // Added productImageUrl prop for displaying product images
}

export function SheetDashboard({ csvUrl, sheetName, filterPack, productImageUrl }: SheetDashboardProps) {
  const [metrics, setMetrics] = useState<MetricAnalysis[]>([])
  const [rawMetrics, setRawMetrics] = useState<MetricData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(csvUrl, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const csvText = await response.text()

        if (!csvText || csvText.length === 0) {
          throw new Error("Empty CSV response")
        }

        const parsedData = parseCSVData(csvText, sheetName, filterPack)
        setRawMetrics(parsedData.metrics)
        const wowData = getWeekOverWeekData(parsedData.metrics)
        setMetrics(wowData)
      } catch (err) {
        console.error("[v0] Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [csvUrl, sheetName, filterPack])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Spinner className="h-8 w-8" />
        <p className="text-muted-foreground">Loading analytics data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <strong>Error:</strong> {error}
          <br />
          <br />
          Please ensure your Google Sheet is published to the web as CSV and the URL is correct.
        </AlertDescription>
      </Alert>
    )
  }

  if (metrics.length === 0) {
    return (
      <Alert>
        <AlertDescription>No metrics found in the data. Please check your CSV format.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {productImageUrl && (
        <div className="flex justify-center">
          <img
            src={productImageUrl || "/placeholder.svg"}
            alt={sheetName}
            className="h-32 w-auto object-contain rounded-lg border bg-muted/20"
          />
        </div>
      )}
      <UnifiedMetricChart metrics={metrics} rawMetrics={rawMetrics} />
    </div>
  )
}
