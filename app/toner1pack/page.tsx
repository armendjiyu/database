import { SupabaseDashboard } from "@/components/supabase-dashboard"
import { DataSidePanel } from "@/components/data-side-panel"

export const metadata = {
  title: "Toner Pads 1 Pack - Analytics Dashboard",
  description: "Week-over-week analytics for Toner Pads 1 Pack",
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Toner Pads 1 Pack Analytics</h1>
          <DataSidePanel productName="Toner Pads 1 Pack" />
        </div>

        <SupabaseDashboard
          productName="Toner Pads 1 Pack"
          productImageUrl="/toner-pads-1-pack-product.jpg"
        />
      </div>
    </div>
  )
}
