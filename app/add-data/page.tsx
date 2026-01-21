"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ManualDataEntry } from "@/components/manual-data-entry"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const PRODUCTS = [
  "Toner Pads 1 Pack",
  "Toner Pads 2 Pack",
  "Toner Pads 3 Pack",
  "NAD+ Cream",
  "Toner & NAD+ Bundle"
]

export default function AddDataPage() {
  const [selectedProduct, setSelectedProduct] = useState<string>("")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Add Daily Metrics</CardTitle>
            <CardDescription>
              Manually enter performance data for a specific product and date
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Product</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map(product => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="pt-4 border-t">
                <ManualDataEntry 
                  productName={selectedProduct} 
                  onSuccess={() => {
                    // Optionally redirect or show success message
                  }} 
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
