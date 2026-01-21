"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard } from "@/components/metric-card"
import { MetricChart } from "@/components/metric-chart"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCSVData, getWeekOverWeekData, type DashboardData } from "@/lib/data-processor"

const SHEET_URLS = [
  {
    name: "TT Seller Central",
    csvUrl:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8V0d5kbxQQjTeR4gQsYE7PzfZUMLXlRxdsKKwDzYG0CNZgoQh_tySjKOGIfjU60LpqG7IqzeZEAgl/pub?output=csv",
    sheetId: "1hMTBUE9flfZocU2gQYBO9ogBgImsDghNJFaJ2MqAA2Q",
    gid: "490405517",
  },
  // Add more tabs here with different gid values
  // {
  //   name: "Another Tab",
  //   csvUrl: "...",
  //   sheetId: "1hMTBUE9flfZocU2gQYBO9ogBgImsDghNJFaJ2MqAA2Q",
  //   gid: "ANOTHER_GID",
  // },
]

export function DashboardClient() {
  const [data, setData] = useState<DashboardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("0")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const results = await Promise.all(
          SHEET_URLS.map(async (sheet) => {
            console.log("[v0] Attempting to fetch:", sheet.name)
            console.log("[v0] CSV URL:", sheet.csvUrl)

            try {
              const response = await fetch(sheet.csvUrl, {
                cache: "no-store",
              })
              console.log("[v0] Response status:", response.status)
              console.log("[v0] Response ok:", response.ok)

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
              }

              const csvText = await response.text()
              console.log("[v0] CSV received, length:", csvText.length)
              console.log("[v0] First 200 chars:", csvText.substring(0, 200))

              if (csvText && csvText.length > 0) {
                const parsedData = parseCSVData(csvText, sheet.name)
                console.log("[v0] Parsed metrics:", parsedData.metrics.length)
                return parsedData
              } else {
                throw new Error("Empty CSV response")
              }
            } catch (err) {
              console.error("[v0] Fetch failed:", err)
              throw err
            }
          }),
        )

        console.log("[v0] All data fetched successfully")
        setData(results)
      } catch (err) {
        console.error("[v0] Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
          {error}
          <br />
          <br />
          <strong>Possible Solutions:</strong>
          <ol className="list-decimal ml-4 mt-2 space-y-2">
            <li>
              <strong>Make sheet public:</strong> In Google Sheets, go to Share → Change to "Anyone with the link" can
              view
            </li>
            <li>
              <strong>Publish to web:</strong> File → Share → Publish to web → Select each tab → Publish as CSV
            </li>
            <li>
              <strong>Update URLs:</strong> Copy the published CSV URLs and update SHEET_URLS in dashboard-client.tsx
            </li>
            <li>
              <strong>Check gid:</strong> Make sure the gid parameter matches your tab's ID (found in the sheet URL)
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <Alert>
        <AlertDescription>No data available. Please check your sheet URLs.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6">
        {data.map((sheet, index) => (
          <TabsTrigger key={index} value={String(index)}>
            {sheet.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {data.map((sheet, index) => {
        const wowData = getWeekOverWeekData(sheet.metrics)

        return (
          <TabsContent key={index} value={String(index)} className="space-y-6">
            {/* Key Metrics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {wowData.map((metric) => (
                <MetricCard key={metric.name} metric={metric} />
              ))}
            </div>

            {/* Detailed Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              {wowData.map((metric) => (
                <Card key={metric.name}>
                  <CardHeader>
                    <CardTitle>{metric.name}</CardTitle>
                    <CardDescription>Last 14 days trend</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MetricChart metric={metric} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
