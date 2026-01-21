"use client"

import Link from "next/link"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon } from "lucide-react"

const products = [
  { name: "Toner Pads 1 Pack", href: "/toner1pack" },
  { name: "Toner Pads 2 Pack", href: "/toner2pack" },
  { name: "Toner Pads 3 Pack", href: "/toner3pack" },
  { name: "NAD+ Cream", href: "/nad1pack" },
  { name: "Toner & NAD+ Bundle", href: "/nadtonerbundle" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#0c6936]/20 bg-white shadow-sm px-5">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/jiyu-logo.png" alt="JIYU Logo" width={120} height={48} className="object-contain" priority />
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-[#0c6936] hover:bg-[#0c6936]/10 hover:text-[#0c6936]">
                Products
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {products.map((product) => (
                <DropdownMenuItem key={product.href} asChild>
                  <Link href={product.href} className="hover:bg-[#0c6936]/10">
                    {product.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
