"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { InstanceCard } from "@/components/instance-card"
import { useToast } from "@/components/ui/use-toast"
import type { Instance } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { RefreshCw, PlusCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { v4 as uuidv4 } from "uuid"
import { getInstanceStatus } from "@/lib/tensordock-api"

export function InstancesModule() {
  // Instance list state
  const [instances, setInstances] = useState<Instance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Add instance form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [friendlyName, setFriendlyName] = useState("")
  const [instanceId, setInstanceId] = useState("")

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

  // Handle form submission for adding new instance
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!friendlyName.trim() || !instanceId.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Check if instance ID already exists
      if (instances.some((i) => i.instanceId === instanceId.trim())) {
        toast({
          title: "Error",
          description: "Instance with this ID already exists",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Check if the instance exists in TensorDock and get its status
      let instanceStatus = false
      try {
        const statusResponse = await getInstanceStatus(instanceId.trim())
        if (statusResponse.success) {
          instanceStatus = statusResponse.status === "running"
        }
      } catch (error) {
        console.error("Failed to get instance status:", error)
        toast({
          title: "Warning",
          description: "Could not verify instance status. Adding with default status.",
          variant: "destructive",
        })
      }

      // Create new instance object
      const newInstance = {
        id: uuidv4(),
        friendlyName: friendlyName.trim(),
        instanceId: instanceId.trim(),
        status: instanceStatus,
        createdAt: new Date().toISOString(),
      }

      // Add new instance to array
      const updatedInstances = [...instances, newInstance]

      // Save updated array to localStorage
      localStorage.setItem("tensordock_instances", JSON.stringify(updatedInstances))

      // Update state
      setInstances(updatedInstances)

      toast({
        title: "Success",
        description: "Instance added successfully",
      })

      // Reset form
      setFriendlyName("")
      setInstanceId("")
    } catch (error) {
      console.error("Error adding instance:", error)
      toast({
        title: "Error",
        description: "Failed to add instance",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Instance Manager</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshAllStatuses()}
            disabled={isRefreshing || instances.length === 0}
            className="flex items-center gap-1 h-7 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {/* Instance List */}
        {isLoading ? (
          <div className="text-center py-4 text-sm">Loading instances...</div>
        ) : instances.length === 0 ? (
          <div className="text-center py-4 border rounded-lg bg-white dark:bg-gray-800">
            <p className="text-sm text-muted-foreground">No instances added yet. Add your first instance below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
      </CardContent>

      <CardFooter className="p-3 pt-0 border-t">
        {/* Add Instance Form */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 w-full">
          <div className="flex-1">
            <Label htmlFor="friendlyName" className="sr-only">
              Friendly Name
            </Label>
            <Input
              id="friendlyName"
              placeholder="Friendly Name"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              disabled={isSubmitting}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="instanceId" className="sr-only">
              TensorDock Instance ID
            </Label>
            <Input
              id="instanceId"
              placeholder="Instance ID"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              disabled={isSubmitting}
              className="h-8 text-sm"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} size="sm" className="h-8">
            {isSubmitting ? (
              "Adding..."
            ) : (
              <>
                <PlusCircle className="mr-1 h-3 w-3" />
                Add Instance
              </>
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
