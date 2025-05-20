import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const apiKey = process.env.TENSORDOCK_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "TENSORDOCK_API_KEY environment variable is not set" },
        { status: 500 },
      )
    }

    const instanceId = params.id

    // Get all instances from TensorDock
    const response = await fetch("https://dashboard.tensordock.com/api/v2/instances", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store", // Ensure we don't cache the response
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to get instances: ${response.statusText}` },
        { status: response.status },
      )
    }

    const instances = await response.json()
    const instance = instances.find((i: any) => i.id === instanceId)

    if (!instance) {
      return NextResponse.json({ success: false, error: `Instance ${instanceId} not found` }, { status: 404 })
    }

    console.log(`Instance ${instanceId} status: ${instance.status}`)

    return NextResponse.json({
      success: true,
      status: instance.status,
    })
  } catch (error) {
    console.error("Error getting instance status:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
