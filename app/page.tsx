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
    <div className="flex flex-col items-center w-full">
      <ApplianceScanner 
        onModelNumberChange={setModelNumber} 
        initialModel={modelNumber}
        initialSerial={serialNumber}
      />
      <LookupsModule modelTag={modelNumber || "Enter model number"} />
      <PartsReviewsModule />
    </div>
  )
}
