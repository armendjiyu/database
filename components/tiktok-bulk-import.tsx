"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"

// Product ID mapping - reordered by product
const PRODUCTS = [
  { id: "1729597548586176631", name: "Toner Pads 1 Pack", table: "toner_1pack_daily" },
  { id: "1731190899772395639", name: "Toner Pads 2 Pack", table: "toner_2pack_daily" },
  { id: "1731857251405893751", name: "Toner Pads 3 Pack", table: "toner_3pack_daily" },
  { id: "1731931607460515959", name: "NAD+ Cream", table: "nad_cream_daily" },
  { id: "1732136029558182007", name: "Toner & NAD+ Bundle", table: "toner_nad_bundle_daily" },
]

interface ProcessedData {
  date: string
  productId: string
  productName: string
  product_impressions: number
  page_views: number
  visitors: number
  customers: number
  gmv: number
  items_sold: number
  orders: number
  subscribers: number
}

export function TikTokBulkImport() {
  const [productListFile, setProductListFile] = useState<File | null>(null)
  const [trafficFiles, setTrafficFiles] = useState<Record<string, File>>({})
  const [preview, setPreview] = useState<ProcessedData[]>([])
  const [processing, setProcessing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleProductListUpload = async (file: File) => {
    setProductListFile(file)
    setResult(null)
  }

  const handleTrafficFileUpload = (productId: string, file: File) => {
    setTrafficFiles(prev => ({ ...prev, [productId]: file }))
    setResult(null)
  }

  const processFiles = async () => {
    if (!productListFile) {
      setResult({ success: false, message: "Please upload the Product List file" })
      return
    }

    setProcessing(true)
    setResult(null)

    try {
      const allData: Record<string, ProcessedData> = {}

      // Process Product List file (has GMV, Orders, Items sold for all products)
      console.log("[v0] Processing Product List file...")
      const productListBuffer = await productListFile.arrayBuffer()
      const productListWorkbook = XLSX.read(productListBuffer)
      const productListSheet = productListWorkbook.Sheets[productListWorkbook.SheetNames[0]]
      const productListJson = XLSX.utils.sheet_to_json(productListSheet, { 
        header: 1,  // Get as array of arrays
        defval: ""
      })

      console.log("[v0] Product List rows:", productListJson.length)
      console.log("[v0] First 3 rows:", productListJson.slice(0, 3))

      // Skip first row (title) and second row (may be date range), find actual header row
      let headerRowIndex = -1
      let headers: string[] = []
      
      for (let i = 0; i < Math.min(5, productListJson.length); i++) {
        const row = productListJson[i] as any[]
        if (row.includes("ID") && row.includes("Product") && row.includes("GMV")) {
          headerRowIndex = i
          headers = row.map(h => String(h || "").trim())
          console.log("[v0] Found header row at index:", i, "Headers:", headers)
          break
        }
      }

      if (headerRowIndex === -1) {
        throw new Error("Could not find header row in Product List file")
      }

      // Process data rows
      for (let i = headerRowIndex + 1; i < productListJson.length; i++) {
        const rowArray = productListJson[i] as any[]
        const row: any = {}
        headers.forEach((header, idx) => {
          row[header] = rowArray[idx]
        })

        const productId = row["ID"]?.toString().trim()
        if (!productId || productId === "0" || productId === "") continue

        console.log("[v0] Found product ID:", productId)

        const product = PRODUCTS.find(p => p.id === productId)
        if (!product) {
          console.log("[v0] Product not found for ID:", productId)
          continue
        }

        // Extract date - look in the first row for date range
        let dateStr = ""
        const firstRow = productListJson[0] as any[]
        const firstRowStr = firstRow.join(" ")
        
        // Try to extract date from "2026-01-19 ~ 2026-01-19" format
        const dateMatch = firstRowStr.match(/(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/)
        if (dateMatch) {
          dateStr = dateMatch[2] // Use end date
        }

        if (!dateStr) {
          console.log("[v0] Could not extract date from first row")
          continue
        }

        console.log("[v0] Processing product:", product.name, "date:", dateStr)

        const key = `${product.id}_${dateStr}`

        if (!allData[key]) {
          allData[key] = {
            date: dateStr,
            productId: product.id,
            productName: product.name,
            product_impressions: 0,
            page_views: 0,
            visitors: 0,
            customers: 0,
            gmv: 0,
            items_sold: 0,
            orders: 0,
            subscribers: 0,
          }
        }

        // Extract GMV, Orders, Items sold
        const gmvStr = row["GMV"]?.toString().replace(/[$,]/g, "") || "0"
        allData[key].gmv = Number(gmvStr) || 0
        allData[key].orders = Number(row["Orders"]) || 0
        allData[key].items_sold = Number(row["Items sold"]) || 0

        console.log("[v0] Added product data:", { gmv: allData[key].gmv, orders: allData[key].orders, items: allData[key].items_sold })
      }

      // Process Traffic files (one per product)
      for (const [productId, file] of Object.entries(trafficFiles)) {
        const product = PRODUCTS.find(p => p.id === productId)
        if (!product) continue

        console.log("[v0] Processing Traffic file for:", product.name)

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer)
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })

        console.log("[v0] Traffic file rows:", rawData.length)
        console.log("[v0] First 3 traffic rows:", rawData.slice(0, 3))

        // Find header row
        let trafficHeaderIndex = -1
        let trafficHeaders: string[] = []
        
        for (let i = 0; i < Math.min(5, rawData.length); i++) {
          const row = rawData[i] as any[]
          if (row.includes("Start Date") && row.includes("End Date")) {
            trafficHeaderIndex = i
            trafficHeaders = row.map(h => String(h || "").trim())
            console.log("[v0] Found traffic header at:", i)
            break
          }
        }

        if (trafficHeaderIndex === -1) {
          console.log("[v0] Could not find traffic header row, skipping")
          continue
        }

        // Process traffic data rows
        for (let i = trafficHeaderIndex + 1; i < rawData.length; i++) {
          const rowArray = rawData[i] as any[]
          const row: any = {}
          trafficHeaders.forEach((header, idx) => {
            row[header] = rowArray[idx]
          })

          // Extract date from "End Date" column
          const endDate = row["End Date"]?.toString().trim()
          if (!endDate) continue

          // Parse date
          const dateMatch = endDate.match(/\d{4}-\d{2}-\d{2}/)
          if (!dateMatch) continue

          const dateStr = dateMatch[0]
          const key = `${productId}_${dateStr}`

          if (!allData[key]) {
            allData[key] = {
              date: dateStr,
              productId: product.id,
              productName: product.name,
              product_impressions: 0,
              page_views: 0,
              visitors: 0,
              customers: 0,
              gmv: 0,
              items_sold: 0,
              orders: 0,
              subscribers: 0,
            }
          }

          // Sum traffic metrics across content types
          allData[key].product_impressions += Number(row["Product Impressions"]) || 0
          allData[key].page_views += Number(row["Page Views"]) || 0
          allData[key].visitors += Number(row["Average Visitors"]) || 0
          allData[key].customers += Number(row["Average Daily Customers"]) || 0

          console.log("[v0] Added traffic data:", {
            date: dateStr,
            productName: product.name,
            impressions: allData[key].product_impressions,
            pageViews: allData[key].page_views,
            visitors: allData[key].visitors,
            customers: allData[key].customers,
          })
        }
      }

      const previewData = Object.values(allData).sort((a, b) => {
        if (a.productName !== b.productName) return a.productName.localeCompare(b.productName)
        return a.date.localeCompare(b.date)
      })

      console.log("[v0] Final preview data:", previewData.length, "records")
      setPreview(previewData)

      if (previewData.length === 0) {
        setResult({ success: false, message: "No data could be extracted. Please check file formats." })
      }
    } catch (error) {
      console.error("[v0] Error processing files:", error)
      setResult({ success: false, message: `Error processing files: ${error}` })
    } finally {
      setProcessing(false)
    }
  }

  const handleSubscriberChange = (index: number, value: string) => {
    const updated = [...preview]
    updated[index].subscribers = Number(value) || 0
    setPreview(updated)
  }

  const handleImport = async () => {
    // Ask for confirmation before importing
    const recordCount = preview.length
    const confirmed = window.confirm(
      `Are you sure you want to import ${recordCount} records?\n\nThis will update all product data in the database.`
    )
    if (!confirmed) return

    setImporting(true)
    setResult(null)

    try {
      const response = await fetch("/api/import-tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: preview }),
      })

      const result = await response.json()

      if (result.success) {
        setResult({ success: true, message: `Successfully imported ${result.imported} records!` })
        setPreview([])
        setProductListFile(null)
        setTrafficFiles({})
      } else {
        setResult({ success: false, message: result.message || "Import failed" })
      }
    } catch (error) {
      console.error("[v0] Import error:", error)
      setResult({ success: false, message: "Failed to import data" })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Upload Product List */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Upload Product List File</CardTitle>
          <CardDescription>
            This file contains GMV, Orders, and Items Sold for all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-list">Product List XLSX</Label>
              <Input
                id="product-list"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleProductListUpload(e.target.files[0])}
              />
              {productListFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {productListFile.name}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Upload Traffic Files */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Upload Traffic Breakdown Files (Optional)</CardTitle>
          <CardDescription>
            Upload individual traffic files for each product to include visitor and impression data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {PRODUCTS.map((product) => (
              <div key={product.id}>
                <Label htmlFor={`traffic-${product.id}`}>
                  {product.name} <span className="text-muted-foreground">({product.id})</span>
                </Label>
                <Input
                  id={`traffic-${product.id}`}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleTrafficFileUpload(product.id, e.target.files[0])}
                />
                {trafficFiles[product.id] && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {trafficFiles[product.id].name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Process Button */}
      <div className="flex justify-center">
        <Button
          onClick={processFiles}
          disabled={!productListFile || processing}
          size="lg"
          className="min-w-[200px]"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Process Files
            </>
          )}
        </Button>
      </div>

      {/* Result Message */}
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {/* Preview Table */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Review & Add Subscribers</CardTitle>
            <CardDescription>
              Review the extracted data and add subscriber counts before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {PRODUCTS.map((product) => {
                const productData = preview.filter((p) => p.productId === product.id)
                if (productData.length === 0) return null

                return (
                  <div key={product.id} className="space-y-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-right">GMV</th>
                            <th className="p-2 text-right">Orders</th>
                            <th className="p-2 text-right">Items</th>
                            <th className="p-2 text-right">Impressions</th>
                            <th className="p-2 text-right">Page Views</th>
                            <th className="p-2 text-right">Visitors</th>
                            <th className="p-2 text-right">Customers</th>
                            <th className="p-2 text-right">Subscribers</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productData.map((row, idx) => {
                            const globalIdx = preview.indexOf(row)
                            return (
                              <tr key={idx} className="border-t">
                                <td className="p-2">{row.date}</td>
                                <td className="p-2 text-right">${row.gmv.toLocaleString()}</td>
                                <td className="p-2 text-right">{row.orders}</td>
                                <td className="p-2 text-right">{row.items_sold}</td>
                                <td className="p-2 text-right">{row.product_impressions.toLocaleString()}</td>
                                <td className="p-2 text-right">{row.page_views.toLocaleString()}</td>
                                <td className="p-2 text-right">{row.visitors.toLocaleString()}</td>
                                <td className="p-2 text-right">{row.customers.toLocaleString()}</td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    value={row.subscribers}
                                    onChange={(e) => handleSubscriberChange(globalIdx, e.target.value)}
                                    className="w-24 text-right"
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}

              <div className="flex justify-end pt-4">
                <Button onClick={handleImport} disabled={importing} size="lg">
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Import to Database
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
