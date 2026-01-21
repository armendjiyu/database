import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductsHeatmap } from "@/components/products-heatmap"

const PRODUCTS = [
  {
    name: "Toner Pads 1 Pack",
    slug: "toner1pack",
    description: "Analytics dashboard for Toner Pads 1 Pack",
  },
  {
    name: "Toner Pads 2 Pack",
    slug: "toner2pack",
    description: "Analytics dashboard for Toner Pads 2 Pack",
  },
  {
    name: "Toner Pads 3 Pack",
    slug: "toner3pack",
    description: "Analytics dashboard for Toner Pads 3 Pack",
  },
  {
    name: "NAD+ Cream",
    slug: "nad1pack",
    description: "Analytics dashboard for NAD+ Cream",
  },
  {
    name: "Toner & NAD+ Bundle",
    slug: "nadtonerbundle",
    description: "Analytics dashboard for Toner & NAD+ Bundle",
  },
]

export const metadata = {
  title: "Product Analytics Dashboard",
  description: "Week-over-week analytics for all products",
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Product Analytics</h1>
          <p className="text-muted-foreground">Select a product to view its analytics dashboard</p>
        </div>

        <div className="mb-8">
          <ProductsHeatmap />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold">Individual Products</h2>
          <p className="text-sm text-muted-foreground">Click to view detailed analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/forecasting">
            <Card className="hover:border-primary transition-colors cursor-pointer bg-gradient-to-r from-amber-500/5 to-transparent border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle>Forecasting Tool</CardTitle>
                <CardDescription>Predict future performance with advanced analytics</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          {PRODUCTS.map((product) => (
            <Link key={product.slug} href={`/${product.slug}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
