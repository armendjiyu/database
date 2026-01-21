'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface CSVImportProps {
  productName: string
  onImportComplete?: () => void
}

export function CSVImport({ productName, onImportComplete }: CSVImportProps) {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      
      const response = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: text, productName }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: `Successfully imported ${data.count} records!` })
        onImportComplete?.()
      } else {
        setResult({ success: false, message: data.error || 'Import failed' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Error reading file' })
    } finally {
      setImporting(false)
      e.target.value = '' // Reset file input
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Import CSV Data</CardTitle>
        <CardDescription>Upload CSV file with daily metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="relative bg-transparent"
              disabled={importing}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={importing}
              />
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose CSV File
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a href="/api/download-template" download="template.csv">
                Download Template
              </a>
            </Button>
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                result.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {result.message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
