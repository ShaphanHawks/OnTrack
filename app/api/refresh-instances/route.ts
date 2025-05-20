import { NextResponse } from "next/server"
import { getTensorDockInstances } from "@/lib/tensordock-api"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { instanceIds } = body

    if (!instanceIds || !Array.isArray(instanceIds)) {
      return NextResponse.json({ success: false, error: "Instance IDs array is required" }, { status: 400 })
    }

    // Get all instances from TensorDock
    const allInstances = await getTensorDockInstances()

    // Filter and map to the requested instances
    const requestedInstances = instanceIds.map((id) => {
      const instance = allInstances.find((i: any) => i.id === id)
      return {
        instanceId: id,
        status: instance ? instance.status : "unknown",
      }
    })

    return NextResponse.json({
      success: true,
      instances: requestedInstances,
    })
  } catch (error) {
    console.error("Error refreshing instances:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
