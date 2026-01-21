"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Database, Upload, Loader2 } from "lucide-react"
import Link from "next/link"

interface DataSidePanelProps {
  productName: string
}

export function DataSidePanel({ productName }: DataSidePanelProps) {
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  const handleAutoImport = async () => {
    // Ask for confirmation before importing
    const confirmed = window.confirm(
      "Are you sure you want to import all products from the sheet?\n\nThis will update data for all products. This action can take a minute."
    )
    if (!confirmed) return

    setImporting(true)
    setImportResult(null)
    
    try {
      const response = await fetch("/api/auto-import-sheets", {
        method: "POST"
      })
      
      const data = await response.json()
      
      if (data.success) {
        const successCount = data.results.filter((r: any) => r.status === "success").length
        setImportResult(`✓ Successfully imported data for ${successCount} products`)
      } else {
        setImportResult(`✗ Import failed: ${data.error}`)
      }
    } catch (error: any) {
      setImportResult(`✗ Error: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Database className="h-4 w-4" />
          Manage Data
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto px-2.5">
        <SheetHeader>
          <SheetTitle>Data Management</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Auto Import */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Auto Import from Sheets
            </h3>
            <p className="text-sm text-muted-foreground">
              Import all historical data from your Google Sheets for all products
            </p>
            <Button 
              onClick={handleAutoImport} 
              disabled={importing}
              className="w-full"
            >
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {importing ? "Importing..." : "Import All Products"}
            </Button>
            {importResult && (
              <p className={`text-sm ${importResult.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                {importResult}
              </p>
            )}
          </div>

          <div className="border-t pt-6 space-y-3">
            <h3 className="text-sm font-semibold">TikTok Shop Import</h3>
            <p className="text-sm text-muted-foreground">
              Import data from TikTok Shop XLSX exports
            </p>
            <Link href="/tiktok-import">
              <Button variant="outline" className="w-full bg-transparent">
                Go to TikTok Import
              </Button>
            </Link>
          </div>

          <div className="border-t pt-6 space-y-3">
            <h3 className="text-sm font-semibold">Manual Entry</h3>
            <p className="text-sm text-muted-foreground">
              Add new daily metrics manually
            </p>
            <Link href="/add-data">
              <Button variant="outline" className="w-full bg-transparent">
                Go to Manual Entry
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
