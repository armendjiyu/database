"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CSVImport } from "./csv-import"
import { ManualDataEntry } from "./manual-data-entry"
import { Database, FileUp } from "lucide-react"

interface DataManagementProps {
  productName: string
  onDataUpdated?: () => void
}

const CsvImport = () => null; // Placeholder for CsvImport component

export function DataManagement({ productName, onDataUpdated }: DataManagementProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Import CSV or manually add new data for {productName}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              Import CSV
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>
          <TabsContent value="csv" className="mt-4">
            <CSVImport productName={productName} onImportComplete={onDataUpdated} />
          </TabsContent>
          <TabsContent value="manual" className="mt-4">
            <ManualDataEntry productName={productName} onSuccess={onDataUpdated} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
