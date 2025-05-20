import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const apiKey = process.env.TENSORDOCK_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "TENSORDOCK_API_KEY environment variable is not set" },
        { status: 500 },
      )
    }

    const instanceId = params.id

    // Start the instance
    const response = await fetch(`https://dashboard.tensordock.com/api/v2/instances/${instanceId}/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to start instance: ${response.statusText}` },
        { status: response.status },
      )
    }

    // Wait 10 seconds as specified in requirements
    await new Promise((resolve) => setTimeout(resolve, 10000))

    // Check if status actually changed
    const statusResponse = await fetch("https://dashboard.tensordock.com/api/v2/instances", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!statusResponse.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to get instance status: ${statusResponse.statusText}` },
        { status: statusResponse.status },
      )
    }

    const instances = await statusResponse.json()
    const instance = instances.find((i: any) => i.id === instanceId)

    if (!instance) {
      return NextResponse.json(
        { success: false, error: `Instance ${instanceId} not found after start attempt` },
        { status: 404 },
      )
    }

    const success = instance.status === "running"

    return NextResponse.json({
      success,
      status: instance.status,
      message: success ? "Instance started successfully" : "Instance failed to start",
    })
  } catch (error) {
    console.error("Error starting instance:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
