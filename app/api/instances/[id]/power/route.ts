import { NextResponse } from "next/server"
import { getInstances, saveInstances } from "@/lib/instances"
import { startTensorDockInstance, stopTensorDockInstance, getTensorDockInstanceStatus } from "@/lib/tensordock-api"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { action } = await request.json()

    if (action !== "start" && action !== "stop") {
      return NextResponse.json({ error: "Invalid action. Must be 'start' or 'stop'" }, { status: 400 })
    }

    const instances = await getInstances()
    const instance = instances.find((i) => i.id === id)

    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 })
    }

    // Call TensorDock API
    if (action === "start") {
      await startTensorDockInstance(instance.instanceId)
    } else {
      await stopTensorDockInstance(instance.instanceId)
    }

    // Wait 10 seconds as specified in requirements
    await new Promise((resolve) => setTimeout(resolve, 10000))

    // Check if status actually changed
    const currentStatus = await getTensorDockInstanceStatus(instance.instanceId)
    const expectedStatus = action === "start" ? "running" : "stopped"
    const success = currentStatus === expectedStatus

    if (success) {
      // Update our database
      const updatedInstances = instances.map((i) => (i.id === id ? { ...i, status: action === "start" } : i))
      await saveInstances(updatedInstances)
    }

    return NextResponse.json({
      success,
      status: currentStatus,
      message: success
        ? `Instance ${action === "start" ? "started" : "stopped"} successfully`
        : `Instance is still ${currentStatus}`,
    })
  } catch (error) {
    console.error("Error toggling power:", error)
    return NextResponse.json({ error: "Failed to toggle power state" }, { status: 500 })
  }
}
