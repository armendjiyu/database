import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { SiteHeader } from "@/components/site-header"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JIYU Analytics",
  description: "Product analytics dashboard for JIYU",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon.png",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased bg-[#fafdf9]`}>
        <AuthProvider>
          <SiteHeader />
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
