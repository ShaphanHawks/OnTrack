"use client"

import { useState } from "react"
import { Trash2, Power, RefreshCw } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Instance } from "@/lib/types"
import { cn } from "@/lib/utils"
import { startInstance, stopInstance, testTensorDockAuth, getInstanceStatus } from "@/lib/tensordock-api"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

    // Authorization check before power action
    const authResult = await testTensorDockAuth();
    if (!authResult.success) {
      toast({
        title: "Authorization Failed",
        description: "Your API token is invalid or expired. Please check your credentials.",
        variant: "destructive",
      });
      setIsTogglingPower(false);
      return;
    }

    const action = instance.status ? "Shutting down" : "Waking up"
    setPowerMessage(`${action}...`)

    try {
      const response = await (instance.status ? stopInstance(instance.instanceId) : startInstance(instance.instanceId))

      if (response.success) {
        // Poll for status confirmation
        const expectedStatus = !instance.status; // true if turning on, false if turning off
        const maxAttempts = 12; // 12 * 5s = 60s
        let attempt = 0;
        let confirmed = false;
        while (attempt < maxAttempts) {
          await new Promise((res) => setTimeout(res, 5000));
          try {
            const statusResp = await getInstanceStatus(instance.instanceId);
            if (statusResp.success) {
              const isOnline = statusResp.status === "running";
              if (isOnline === expectedStatus) {
                onStatusChange(instance.id, isOnline);
                toast({
                  title: `Instance is now ${isOnline ? "Online" : "Offline"}`,
                  description: `The server has been confirmed ${isOnline ? "started" : "stopped"}.`,
                });
                confirmed = true;
                break;
              }
            }
          } catch (err) {
            // Ignore polling errors, try again
          }
          attempt++;
        }
        if (!confirmed) {
          setPowerWarning(true);
          setPowerMessage("⚠️ Timed out waiting for server status confirmation.");
          toast({
            title: "Status Confirmation Timeout",
            description: "Could not confirm the server's new state after 1 minute. Please check the provider dashboard.",
            variant: "destructive",
          });
        }
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
    <TooltipProvider>
      <Card
        className={cn(
          "transition-all duration-200",
          instance.status ? "border-green-200 dark:border-green-900" : "border-red-200 dark:border-red-900",
        )}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl" role="img" aria-label="Computer">
                {statusEmoji}
              </span>
              <div>
                <h3 className="font-medium text-sm">{instance.friendlyName}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{instance.instanceId}</p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{instance.instanceId}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Badge
                variant={instance.status ? "default" : "outline"}
                className={cn(
                  "text-xs px-1.5 h-5",
                  instance.status
                    ? "bg-green-500 hover:bg-green-600"
                    : "text-red-500 border-red-200 dark:border-red-800",
                )}
              >
                {instance.status ? "Online" : "Offline"}
              </Badge>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshStatus}
                disabled={isRefreshing || isTogglingPower || isDeleting}
                className="h-6 w-6 text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                <span className="sr-only">Refresh Status</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting || isTogglingPower}
                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-3 w-3" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-2 pt-0">
          <Button
            onClick={handleTogglePower}
            disabled={isTogglingPower || isDeleting}
            variant={instance.status ? "destructive" : "default"}
            size="sm"
            className={cn(
              "w-full text-xs h-7",
              instance.status ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600",
            )}
          >
            <Power className="mr-1 h-3 w-3" />
            {isTogglingPower ? "Processing..." : instance.status ? "Turn Off" : "Turn On"}
          </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}
