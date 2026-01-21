"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"

interface ManualDataEntryProps {
  productName: string
  onSuccess?: () => void
}

const METRICS = [
  "GMV",
  "Items Sold",
  "Orders",
  "AOV",
  "Units per Order",
  "Product Impressions",
  "Page Views",
  "Click-through Rate",
  "Avg Visitors",
  "Avg. Customers",
  "Conv. Rate",
  "$ per Visitor",
  "$ per Customer",
  "Subscribers"
]

export function ManualDataEntry({ productName, onSuccess }: ManualDataEntryProps) {
  const [date, setDate] = useState<Date>()
  const [metrics, setMetrics] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async () => {
    if (!date) {
      setMessage("Please select a date")
      return
    }

    const metricsData = Object.entries(metrics)
      .filter(([_, value]) => value && value.trim() !== "")
      .reduce((acc, [metric, value]) => {
        acc[metric] = parseFloat(value)
        return acc
      }, {} as Record<string, number>)

    if (Object.keys(metricsData).length === 0) {
      setMessage("Please enter at least one metric value")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/add-metric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          date: format(date, "yyyy-MM-dd"),
          metrics: metricsData
        })
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`✓ Successfully added metrics for ${format(date, "MMM d, yyyy")}`)
        setMetrics({})
        setDate(undefined)
        onSuccess?.()
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage("Failed to add data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Day Data</CardTitle>
        <CardDescription>Manually enter metrics for a specific date</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
          {METRICS.map((metric) => (
            <div key={metric} className="space-y-2">
              <Label htmlFor={metric} className="text-sm">{metric}</Label>
              <Input
                id={metric}
                type="number"
                step="0.01"
                placeholder="Enter value"
                value={metrics[metric] || ""}
                onChange={(e) => setMetrics(prev => ({ ...prev, [metric]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full" style={{ backgroundColor: '#0c6936' }}>
          <Plus className="mr-2 h-4 w-4" />
          {loading ? "Adding..." : "Add Data"}
        </Button>

        {message && (
          <p className={`text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
