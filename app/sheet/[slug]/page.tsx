import { Suspense } from "react"
import { SheetDashboard } from "@/components/sheet-dashboard"
import { Spinner } from "@/components/ui/spinner"

const SHEETS: Record<string, { name: string; csvUrl: string }> = {
  "tt-seller-central": {
    name: "TT Seller Central",
    csvUrl:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8V0d5kbxQQjTeR4gQsYE7PzfZUMLXlRxdsKKwDzYG0CNZgoQh_tySjKOGIfjU60LpqG7IqzeZEAgl/pub?output=csv",
  },
  // Add more sheets here
}

export function generateStaticParams() {
  return Object.keys(SHEETS).map((slug) => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const sheet = SHEETS[params.slug]
  return {
    title: `${sheet?.name || "Sheet"} Analytics`,
    description: `Week-over-week analytics for ${sheet?.name || "this sheet"}`,
  }
}

export default function SheetPage({ params }: { params: { slug: string } }) {
  const sheet = SHEETS[params.slug]

  if (!sheet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sheet Not Found</h1>
          <p className="text-muted-foreground">The requested sheet does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{sheet.name}</h1>
          <p className="text-muted-foreground">
            Last 7 days (Current Week) vs Previous 7 days • Auto-updates on refresh
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          }
        >
          <SheetDashboard csvUrl={sheet.csvUrl} sheetName={sheet.name} />
        </Suspense>
      </div>
    </div>
  )
}
