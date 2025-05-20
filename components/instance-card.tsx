"use client"

import { useState } from "react"
import { Trash2, Power, RefreshCw } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Instance } from "@/lib/types"
import { cn } from "@/lib/utils"
import { startInstance, stopInstance } from "@/lib/tensordock-api"
import { toast } from "@/components/ui/use-toast"

interface InstanceCardProps {
  instance: Instance
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: boolean) => void
}

export function InstanceCard({ instance, onDelete, onStatusChange }: InstanceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingPower, setIsTogglingPower] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [powerMessage, setPowerMessage] = useState("")
  const [powerWarning, setPowerWarning] = useState(false)

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this instance?")) {
      setIsDeleting(true)
      try {
        onDelete(instance.id)
      } catch (error) {
        console.error("Failed to delete instance:", error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleRefreshStatus = async () => {
    setIsRefreshing(true)
    try {
      // Add cache-busting parameter
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
        onStatusChange(instance.id, newStatus)

        if (newStatus !== instance.status) {
          toast({
            title: "Status Updated",
            description: `Instance is now ${newStatus ? "Online" : "Offline"}`,
          })
        }
      }
    } catch (error) {
      console.error("Failed to refresh status:", error)
      toast({
        title: "Error",
        description: "Failed to refresh status",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleTogglePower = async () => {
    setIsTogglingPower(true)
    setPowerWarning(false)

    const action = instance.status ? "Shutting down" : "Waking up"
    setPowerMessage(`${action}...`)

    try {
      const response = await (instance.status ? stopInstance(instance.instanceId) : startInstance(instance.instanceId))

      if (response.success) {
        onStatusChange(instance.id, !instance.status)
        setPowerMessage(`${instance.status ? "Stopped" : "Started"} successfully`)
      } else {
        setPowerWarning(true)
        setPowerMessage(`⚠️ ${response.message || `Still ${instance.status ? "On" : "Off"}`}`)
      }
    } catch (error) {
      console.error("Failed to toggle power:", error)
      setPowerWarning(true)
      setPowerMessage("⚠️ Error occurred")
    } finally {
      setTimeout(() => {
        setIsTogglingPower(false)
        setPowerMessage("")
      }, 3000)
    }
  }

  // Determine emoji based on power state
  const statusEmoji = instance.status ? "💻" : "🖥️"

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        instance.status ? "border-green-200 dark:border-green-900" : "border-red-200 dark:border-red-900",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="Computer">
              {statusEmoji}
            </span>
            <CardTitle>{instance.friendlyName}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshStatus}
              disabled={isRefreshing || isTogglingPower || isDeleting}
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              <span className="sr-only">Refresh Status</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting || isTogglingPower}
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">ID: {instance.instanceId}</div>
          <div className="flex items-center gap-2">
            <Badge
              variant={instance.status ? "default" : "outline"}
              className={
                instance.status ? "bg-green-500 hover:bg-green-600" : "text-red-500 border-red-200 dark:border-red-800"
              }
            >
              {instance.status ? "Online" : "Offline"}
            </Badge>
            {powerMessage && (
              <span className={cn("text-xs", powerWarning ? "text-amber-500" : "text-muted-foreground")}>
                {powerMessage}
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleTogglePower}
          disabled={isTogglingPower || isDeleting}
          variant={instance.status ? "destructive" : "default"}
          className={cn("w-full", instance.status ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600")}
        >
          <Power className="mr-2 h-4 w-4" />
          {isTogglingPower ? "Processing..." : instance.status ? "Turn Off" : "Turn On"}
        </Button>
      </CardFooter>
    </Card>
  )
}
