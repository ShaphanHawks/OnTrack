import { NextResponse } from "next/server"
import { getTensorDockInstanceStatus } from "@/lib/tensordock-api"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { instanceId } = body

    if (!instanceId) {
      return NextResponse.json({ success: false, error: "Instance ID is required" }, { status: 400 })
    }

    const status = await getTensorDockInstanceStatus(instanceId)

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error("Error getting instance status:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
