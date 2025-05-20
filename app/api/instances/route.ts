import { NextResponse } from "next/server"
import { getInstances, saveInstances } from "@/lib/instances"
import type { Instance } from "@/lib/types"

export async function GET() {
  try {
    const instances = await getInstances()
    return NextResponse.json(instances)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch instances" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.friendlyName || !body.instanceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const instances = await getInstances()

    // Check if instance with this ID already exists
    if (instances.some((i) => i.instanceId === body.instanceId)) {
      return NextResponse.json({ error: "Instance with this ID already exists" }, { status: 400 })
    }

    const newInstance: Instance = {
      id: crypto.randomUUID(),
      friendlyName: body.friendlyName,
      instanceId: body.instanceId,
      status: false,
      createdAt: new Date().toISOString(),
    }

    await saveInstances([...instances, newInstance])

    return NextResponse.json(newInstance, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create instance" }, { status: 500 })
  }
}
