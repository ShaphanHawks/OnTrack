"use client"

import { useState, useEffect } from "react"
import { ApplianceScanner } from "@/components/appliance-scanner"
import { LookupsModule } from "@/components/lookups-module"
import { PartsReviewsModule } from "@/components/parts-info-module"

interface HistoryData {
  modelNumber: string
  serialNumber: string
}

export default function Dashboard() {
  const [modelNumber, setModelNumber] = useState<string>("")
  const [serialNumber, setSerialNumber] = useState<string>("")

  // Check for selected model from history on page load
  useEffect(() => {
    const selectedModel = localStorage.getItem("selectedModel")
    const selectedSerial = localStorage.getItem("selectedSerial")
    if (selectedModel) {
      setModelNumber(selectedModel)
      if (selectedSerial) {
        setSerialNumber(selectedSerial)
      }
      // Clear the selected data from storage after using it
      localStorage.removeItem("selectedModel")
      localStorage.removeItem("selectedSerial")
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="space-y-4">
          <ApplianceScanner 
            onModelNumberChange={setModelNumber} 
            initialModel={modelNumber}
            initialSerial={serialNumber}
          />
          <LookupsModule modelTag={modelNumber || "Enter model number"} />
          <PartsReviewsModule />
        </div>
      </div>
    </div>
  )
}
