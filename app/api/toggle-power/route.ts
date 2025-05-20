import { NextResponse } from "next/server"
import { startTensorDockInstance, stopTensorDockInstance, getTensorDockInstanceStatus } from "@/lib/tensordock-api"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { instanceId, turnOn } = body

    if (!instanceId) {
      return NextResponse.json({ success: false, error: "Instance ID is required" }, { status: 400 })
    }

    if (turnOn === undefined) {
      return NextResponse.json({ success: false, error: "turnOn parameter is required" }, { status: 400 })
    }

    // Call TensorDock API to change power state
    if (turnOn) {
      await startTensorDockInstance(instanceId)
    } else {
      await stopTensorDockInstance(instanceId)
    }

    // Wait 10 seconds as specified in requirements
    await new Promise((resolve) => setTimeout(resolve, 10000))

    // Check if status actually changed
    const currentStatus = await getTensorDockInstanceStatus(instanceId)
    const expectedStatus = turnOn ? "running" : "stopped"

    if (currentStatus === expectedStatus) {
      return NextResponse.json({
        success: true,
        status: currentStatus,
      })
    } else {
      return NextResponse.json({
        success: false,
        status: currentStatus,
        message: `Instance is still ${currentStatus}`,
      })
    }
  } catch (error) {
    console.error("Error toggling power:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
