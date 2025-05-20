import { DashboardHeader } from "@/components/dashboard-header"
import { AddInstanceForm } from "@/components/add-instance-form"
import { InstanceList } from "@/components/instance-list"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-4">
        <DashboardHeader />

        <div className="mt-4">
          <InstanceList />
        </div>

        <div className="mt-4">
          <AddInstanceForm />
        </div>
      </div>
    </div>
  )
}
