"use client"

import { useState, useEffect } from "react"
import { InstanceCard } from "@/components/instance-card"
import { useToast } from "@/components/ui/use-toast"
import type { Instance } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function InstanceList() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Load instances from localStorage on component mount
  useEffect(() => {
    loadInstances()
  }, [])

  const loadInstances = async () => {
    setIsLoading(true)
    try {
      const storedInstances = localStorage.getItem("tensordock_instances")
      if (storedInstances) {
        const parsedInstances = JSON.parse(storedInstances)
        setInstances(parsedInstances)

        // Immediately refresh status after loading
        await refreshAllStatuses(parsedInstances)
      }
    } catch (error) {
      console.error("Failed to load instances from localStorage:", error)
      toast({
        title: "Error",
        description: "Failed to load saved instances",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh all instance statuses
  const refreshAllStatuses = async (instancesArray = instances) => {
    if (instancesArray.length === 0) return

    setIsRefreshing(true)
    const updatedInstances = [...instancesArray]
    let hasChanges = false

    try {
      // Use Promise.all to make all requests in parallel
      const statusPromises = updatedInstances.map(async (instance, index) => {
        try {
          // Add cache-busting parameter to prevent stale responses
          const timestamp = new Date().getTime()
          const response = await fetch(`/api/instances/${instance.instanceId}/status?t=${timestamp}`, {
            method: "GET",
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          })

          if (!response.ok) throw new Error(`Status check failed: ${response.statusText}`)

          const data = await response.json()
          if (data.success) {
            const newStatus = data.status === "running"
            if (updatedInstances[index].status !== newStatus) {
              updatedInstances[index].status = newStatus
              hasChanges = true
            }
          }
        } catch (error) {
          console.error(`Failed to refresh status for instance ${updatedInstances[index].id}:`, error)
        }
      })

      await Promise.all(statusPromises)

      if (hasChanges) {
        setInstances(updatedInstances)
        localStorage.setItem("tensordock_instances", JSON.stringify(updatedInstances))
        toast({
          title: "Status Updated",
          description: "Instance statuses have been refreshed",
        })
      }
    } catch (error) {
      console.error("Failed to refresh statuses:", error)
      toast({
        title: "Error",
        description: "Failed to refresh instance statuses",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Set up periodic refresh
  useEffect(() => {
    if (isLoading || instances.length === 0) return

    // Refresh every 30 seconds
    const interval = setInterval(() => refreshAllStatuses(), 30000)
    return () => clearInterval(interval)
  }, [instances, isLoading])

  // Handle instance deletion
  const handleDeleteInstance = (id: string) => {
    try {
      // Filter out the deleted instance
      const updatedInstances = instances.filter((instance) => instance.id !== id)

      // Save to localStorage
      localStorage.setItem("tensordock_instances", JSON.stringify(updatedInstances))

      // Update state
      setInstances(updatedInstances)

      toast({
        title: "Success",
        description: "Instance deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete instance:", error)
      toast({
        title: "Error",
        description: "Failed to delete instance",
        variant: "destructive",
      })
    }
  }

  // Handle status change
  const handleStatusChange = (id: string, newStatus: boolean) => {
    try {
      // Update the instance status
      const updatedInstances = instances.map((instance) =>
        instance.id === id ? { ...instance, status: newStatus } : instance,
      )

      // Save to localStorage
      localStorage.setItem("tensordock_instances", JSON.stringify(updatedInstances))

      // Update state
      setInstances(updatedInstances)
    } catch (error) {
      console.error("Failed to update instance status:", error)
      toast({
        title: "Error",
        description: "Failed to update instance status",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading instances...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your GPU Instances</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshAllStatuses()}
          disabled={isRefreshing || instances.length === 0}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
      </div>

      {instances.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-white dark:bg-gray-800">
          <p className="text-muted-foreground">No instances added yet. Add your first GPU instance above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              onDelete={handleDeleteInstance}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
