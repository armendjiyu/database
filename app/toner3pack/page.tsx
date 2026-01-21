import { SupabaseDashboard } from "@/components/supabase-dashboard"
import { DataSidePanel } from "@/components/data-side-panel"

export const metadata = {
  title: "Toner Pads 3 Pack - Analytics Dashboard",
  description: "Week-over-week analytics for Toner Pads 3 Pack",
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Toner Pads 3 Pack Analytics</h1>
          <DataSidePanel productName="Toner Pads 3 Pack" />
        </div>

        <SupabaseDashboard
          productName="Toner Pads 3 Pack"
          productImageUrl="/toner-pads-3-pack-product.jpg"
        />
      </div>
    </div>
  )
}
