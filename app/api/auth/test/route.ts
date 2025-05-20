import { NextResponse } from "next/server"

export async function POST() {
  try {
    const apiKey = process.env.TENSORDOCK_API_KEY

    if (!apiKey) {
      console.error("TENSORDOCK_API_KEY environment variable is not set")
      return NextResponse.json(
        { success: false, error: "TENSORDOCK_API_KEY environment variable is not set" },
        { status: 500 },
      )
    }

    console.log("Testing TensorDock API connection...")

    const response = await fetch("https://dashboard.tensordock.com/api/v2/auth/test", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`TensorDock API auth test failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { success: false, error: `Authorization failed: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("TensorDock API auth test successful:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error testing TensorDock auth:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
