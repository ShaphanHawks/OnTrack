"use client"

import type React from "react"

import { useState } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"
import { getInstanceStatus } from "@/lib/tensordock-api"

export function AddInstanceForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [friendlyName, setFriendlyName] = useState("")
  const [instanceId, setInstanceId] = useState("")
  const { toast } = useToast()

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
      // Get existing instances from localStorage
      let instances = []
      try {
        const existingInstances = localStorage.getItem("tensordock_instances")
        if (existingInstances) {
          instances = JSON.parse(existingInstances)
        }
      } catch (error) {
        console.error("Failed to parse existing instances:", error)
      }

      // Check if instance ID already exists
      if (instances.some((i: any) => i.instanceId === instanceId.trim())) {
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
      instances.push(newInstance)

      // Save updated array to localStorage
      localStorage.setItem("tensordock_instances", JSON.stringify(instances))

      toast({
        title: "Success",
        description: "Instance added successfully",
      })

      // Reset form
      setFriendlyName("")
      setInstanceId("")

      // Force page refresh to show the new instance
      window.location.reload()
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
    <Card>
      <CardHeader>
        <CardTitle>Add New GPU Instance</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="friendlyName">Friendly Name</Label>
            <Input
              id="friendlyName"
              placeholder="My GPU Server"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instanceId">TensorDock Instance ID</Label>
            <Input
              id="instanceId"
              placeholder="instance_123456"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              "Adding..."
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Machine
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
