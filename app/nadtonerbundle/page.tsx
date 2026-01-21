import { SupabaseDashboard } from "@/components/supabase-dashboard"
import { DataSidePanel } from "@/components/data-side-panel"

export const metadata = {
  title: "Toner & NAD+ Bundle - Analytics Dashboard",
  description: "Week-over-week analytics for Toner & NAD+ Bundle",
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Toner & NAD+ Bundle Analytics</h1>
          <DataSidePanel productName="Toner & NAD+ Bundle" />
        </div>

        <SupabaseDashboard
          productName="Toner & NAD+ Bundle"
          productImageUrl="/toner-nad-bundle-product.jpg"
        />
      </div>
    </div>
  )
}
