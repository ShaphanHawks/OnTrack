"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react"
import type { ReactElement } from "react"

const STORAGE_KEY = "partsInfoModuleOpen"

export function PartsInfoModule(): ReactElement {
  const [partNumber, setPartNumber] = useState<string>("")
  const [open, setOpen] = useState<boolean>(true)

  // Load persisted state
  useEffect(() => {
    const persisted = localStorage.getItem(STORAGE_KEY)
    if (persisted !== null) setOpen(persisted === "true")
  }, [])

  // Persist state on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, open ? "true" : "false")
  }, [open])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPartNumber(e.target.value)
  }

  const toggleOpen = (): void => {
    setOpen((prevOpen: boolean) => !prevOpen)
  }

  return (
    <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={toggleOpen}>
        <h2 className="text-2xl font-bold">Parts Info</h2>
        {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </div>
      
      {open && (
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter part number"
            value={partNumber}
            onChange={handleInputChange}
            className="w-full"
          />
          
          <div className="space-y-2">
            <a 
              href={`https://www.searspartsdirect.com/search?q=${encodeURIComponent(partNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full justify-between">
                SearsPartsDirect
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <a 
              href={`https://my.marcone.com/Home/RunSearchPartModelList?searchString=${encodeURIComponent(partNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full justify-between">
                Marcone
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <a 
              href={`https://appliantology.org/search/?&q=${encodeURIComponent(partNumber)}&quick=1&search_and_or=and&sortby=relevancy`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full justify-between">
                Appliantology
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  )
} 