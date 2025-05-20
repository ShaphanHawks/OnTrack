"use server"
import type { InstanceInput } from "@/lib/types"

// Server-side TensorDock API functions
async function getTensorDockApiKey() {
  const apiKey = process.env.TENSORDOCK_API_KEY
  if (!apiKey) {
    throw new Error("TENSORDOCK_API_KEY environment variable is not set")
  }
  return apiKey
}

export async function getTensorDockInstances() {
  const apiKey = await getTensorDockApiKey()

  const response = await fetch("https://dashboard.tensordock.com/api/v2/instances", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to get instances: ${response.statusText}`)
  }

  return await response.json()
}

export async function getTensorDockInstanceStatus(instanceId: string) {
  try {
    const instances = await getTensorDockInstances()
    const instance = instances.find((i: any) => i.id === instanceId)

    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`)
    }

    return instance.status
  } catch (error) {
    console.error(`Error getting instance status: ${error}`)
    throw error
  }
}

export async function startTensorDockInstance(instanceId: string) {
  const apiKey = await getTensorDockApiKey()

  const response = await fetch(`https://dashboard.tensordock.com/api/v2/instances/${instanceId}/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to start instance: ${response.statusText}`)
  }

  return await response.json()
}

export async function stopTensorDockInstance(instanceId: string) {
  const apiKey = await getTensorDockApiKey()

  const response = await fetch(`https://dashboard.tensordock.com/api/v2/instances/${instanceId}/stop`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to stop instance: ${response.statusText}`)
  }

  return await response.json()
}

export async function addInstance(input: InstanceInput) {
  // Implementation removed for brevity
  return { success: true }
}

export async function deleteInstance(id: string) {
  // Implementation removed for brevity
  return { success: true }
}

export async function toggleInstancePower(id: string, turnOn: boolean) {
  // Implementation removed for brevity
  return { success: true }
}
