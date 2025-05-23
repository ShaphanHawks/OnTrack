import { Cpu } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-2 mb-1">
        <Cpu className="h-6 w-6 text-purple-600" />
        <h1 className="text-2xl font-bold">Appliance Bar Code Scanner</h1>
      </div>
    </div>
  )
}
