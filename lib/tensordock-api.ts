// Client-side API functions for TensorDock

// Test API authorization
export async function testTensorDockAuth() {
  try {
    const response = await fetch("/api/auth/test", {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || `Failed with status: ${response.status}`,
      }
    }

    return await response.json()
  } catch (error) {
    console.error("Error testing TensorDock auth:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Get status of a specific instance
export async function getInstanceStatus(instanceId: string) {
  const response = await fetch(`/api/instances/${instanceId}/status`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to get instance status: ${response.statusText}`)
  }

  return await response.json()
}

// Start a specific instance
export async function startInstance(instanceId: string) {
  const response = await fetch(`/api/instances/${instanceId}/start`, {
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(`Failed to start instance: ${response.statusText}`)
  }

  return await response.json()
}

// Stop a specific instance
export async function stopInstance(instanceId: string) {
  const response = await fetch(`/api/instances/${instanceId}/stop`, {
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(`Failed to stop instance: ${response.statusText}`)
  }

  return await response.json()
}

// The following functions are needed for compatibility with existing code

// Get all instances from TensorDock (server-side only)
export async function getTensorDockInstances() {
  // This is a server-side function, but we're providing a client-side stub for compatibility
  console.warn("getTensorDockInstances should only be called server-side")
  return []
}

// Get status of a specific instance (server-side only)
export async function getTensorDockInstanceStatus(instanceId: string) {
  // This is a server-side function, but we're providing a client-side stub for compatibility
  console.warn("getTensorDockInstanceStatus should only be called server-side")
  const response = await getInstanceStatus(instanceId)
  return response.status
}

// Start a specific instance (server-side only)
export async function startTensorDockInstance(instanceId: string) {
  // This is a server-side function, but we're providing a client-side stub for compatibility
  console.warn("startTensorDockInstance should only be called server-side")
  return await startInstance(instanceId)
}

// Stop a specific instance (server-side only)
export async function stopTensorDockInstance(instanceId: string) {
  // This is a server-side function, but we're providing a client-side stub for compatibility
  console.warn("stopTensorDockInstance should only be called server-side")
  return await stopInstance(instanceId)
}
