import { SupabaseDashboard } from "@/components/supabase-dashboard"
import { DataSidePanel } from "@/components/data-side-panel"

export const metadata = {
  title: "NAD+ Cream - Analytics Dashboard",
  description: "Week-over-week analytics for NAD+ Cream",
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">NAD+ Cream Analytics</h1>
          <DataSidePanel productName="NAD+ Cream" />
        </div>

        <SupabaseDashboard
          productName="NAD+ Cream"
          productImageUrl="/nad-cream-product.jpg"
        />
      </div>
    </div>
  )
}
