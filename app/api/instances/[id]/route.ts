import { NextResponse } from "next/server"
import { getInstances, saveInstances } from "@/lib/instances"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const instances = await getInstances()

    const instanceExists = instances.some((i) => i.id === id)
    if (!instanceExists) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 })
    }

    const updatedInstances = instances.filter((i) => i.id !== id)
    await saveInstances(updatedInstances)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete instance" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    const instances = await getInstances()
    const instanceIndex = instances.findIndex((i) => i.id === id)

    if (instanceIndex === -1) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 })
    }

    // Update only the fields that are provided
    const updatedInstance = {
      ...instances[instanceIndex],
      ...body,
    }

    instances[instanceIndex] = updatedInstance
    await saveInstances(instances)

    return NextResponse.json(updatedInstance)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update instance" }, { status: 500 })
  }
}
