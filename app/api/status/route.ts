import { NextResponse } from "next/server"
import { testTensorDockAuth } from "@/lib/tensordock-api"

export async function GET() {
  try {
    // Test authorization first
    const authResult = await testTensorDockAuth()

    if (authResult.success) {
      return NextResponse.json({
        connected: true,
        message: "TensorDock API is connected",
        organizationId: authResult.organizationId,
      })
    } else {
      return NextResponse.json(
        {
          connected: false,
          message: "Authorization failed",
          error: "API returned unsuccessful response",
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("TensorDock API authorization failed:", error)

    return NextResponse.json(
      {
        connected: false,
        message: "Failed to connect to TensorDock API",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    )
  }
}
