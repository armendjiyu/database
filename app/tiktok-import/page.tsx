"use client"

import { TikTokBulkImport } from "@/components/tiktok-bulk-import"

export default function TikTokImportPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">TikTok Data Import</h1>
          <p className="text-muted-foreground">
            Import data from TikTok Shop exports. Upload the Product List file for GMV/Orders data across all products,
            then upload individual Traffic Breakdown files for each product.
          </p>
        </div>
        
        <TikTokBulkImport />
      </div>
    </div>
  )
}
