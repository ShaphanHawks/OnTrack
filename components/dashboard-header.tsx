import { Cpu } from "lucide-react"
import { ApiStatusIndicator } from "@/components/api-status-indicator"

export function DashboardHeader() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-2 mb-2">
        <Cpu className="h-8 w-8 text-purple-600" />
        <h1 className="text-3xl font-bold">TensorDock Dashboard</h1>
      </div>
      <p className="text-muted-foreground max-w-2xl mb-4">
        Manage your GPU instances in one place. Add new instances, control power states, and monitor status.
      </p>
      <div className="flex justify-center w-full">
        <ApiStatusIndicator />
      </div>
    </div>
  )
}
