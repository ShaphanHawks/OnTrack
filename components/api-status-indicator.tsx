"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { testTensorDockAuth } from "@/lib/tensordock-api"

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<"loading" | "connected" | "failed">("loading")
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const checkApiStatus = async () => {
    setIsChecking(true)
    setStatus("loading")
    setErrorMessage(null)

    try {
      const result = await testTensorDockAuth()
      if (result.success) {
        setStatus("connected")
      } else {
        setStatus("failed")
        setErrorMessage(result.error || "Unknown error")
      }
    } catch (error) {
      console.error("Failed to check API status:", error)
      setStatus("failed")
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsChecking(false)
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkApiStatus()

    // Check status every 5 minutes
    const interval = setInterval(checkApiStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">TensorDock API</span>
        {status === "loading" ? (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : status === "connected" ? (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-500">Connected</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>TensorDock API is connected and working properly</p>
              {lastChecked && (
                <p className="text-xs text-muted-foreground">Last checked: {lastChecked.toLocaleTimeString()}</p>
              )}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-500">Failed</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Unable to connect to TensorDock API</p>
              {errorMessage && <p className="text-xs text-red-400 mt-1">{errorMessage}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Check your API key and verify it has the correct permissions
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={checkApiStatus} disabled={isChecking}>
              <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
              <span className="sr-only">Refresh API status</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Check API connection</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
