import { NextResponse } from "next/server"

export async function GET() {
  const csvContent = `Date,GMV,Items Sold,Orders,AOV,Units per Order,Product Impressions,Page Views,Click-through Rate,Visitors,Customers,Conv. Rate,$ per Visitor,$ per Customer,Subscribers
2026-01-20,1000.00,50,25,40.00,2.0,5000,1000,20.0,500,100,20.0,2.00,10.00,10
2026-01-21,,,,,,,,,,,,,
2026-01-22,,,,,,,,,,,,,`

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=template.csv"
    }
  })
}
