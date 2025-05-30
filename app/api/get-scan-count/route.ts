import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function GET() {
  try {
    const count = await kv.get("total_scans") || 0
    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error("Error getting scan count:", error)
    return NextResponse.json(
      { success: false, error: "Failed to get scan count" },
      { status: 500 }
    )
  }
} 