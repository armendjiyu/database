import { ForecastChart } from "@/components/forecast-chart"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Product Forecasting - Analytics Dashboard",
  description: "Advanced forecasting using Exponential Smoothing",
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Product Forecasting</h1>
            </div>
            <p className="text-muted-foreground">
              Generate data-driven forecasts using Exponential Smoothing algorithm
            </p>
          </div>
        </div>

        <ForecastChart />
      </div>
    </div>
  )
}
