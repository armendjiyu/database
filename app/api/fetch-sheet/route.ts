import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DashboardBot/1.0)",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    const text = await response.text()
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/csv",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching sheet:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sheet" },
      { status: 500 },
    )
  }
}
