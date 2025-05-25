"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react"
import type { ReactElement } from "react"

const STORAGE_KEY = "partsReviewsModuleOpen"

export function PartsReviewsModule(): ReactElement {
  const [partNumber, setPartNumber] = useState<string>("")
  const [submittedPartNumber, setSubmittedPartNumber] = useState<string>("")
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

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    setSubmittedPartNumber(partNumber)
  }

  const toggleOpen = (): void => {
    setOpen((prevOpen: boolean) => !prevOpen)
  }

  return (
    <div className="max-w-xl mx-auto bg-white border-2 border-[#FAD9CC] rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={toggleOpen}>
        <h2 className="text-lg font-semibold text-gray-800">Parts Reviews</h2>
        {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </div>
      
      {open && (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter part number"
              value={partNumber}
              onChange={handleInputChange}
              className="w-full"
            />
            <Button type="submit" className="w-full">
              Search
            </Button>
          </form>
          
          {submittedPartNumber && (
            <div className="space-y-2">
              <a 
                href={`https://www.amazon.com/s?k=${encodeURIComponent(submittedPartNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-between">
                  Amazon
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <a 
                href={`https://partsdr.com/model-number-search?query=${encodeURIComponent(submittedPartNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-between">
                  PartsDr
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <a 
                href={`https://www.searspartsdirect.com/search?q=${encodeURIComponent(submittedPartNumber)}`}
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
                href={`https://www.appliancepartspros.com/search.aspx?p=${encodeURIComponent(submittedPartNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-between">
                  AppliancePartsPros
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <a 
                href={`https://www.repairclinic.com/Shop-For-Parts?query=${encodeURIComponent(submittedPartNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-between">
                  Repair Clinic
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 