"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <React.Fragment>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full bg-[#F26D4B] p-2 text-white hover:bg-[#F26D4B]/90 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 z-50">
          <div className="container mx-auto px-4 py-8">
            <nav className="flex flex-col space-y-6">
              <Link 
                href="/scan" 
                className="text-lg hover:text-[#F26D4B] dark:hover:text-[#F26D4B] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Scan
              </Link>
              <Link 
                href="/history" 
                className="text-lg hover:text-[#F26D4B] dark:hover:text-[#F26D4B] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                History
              </Link>
              <Link 
                href="/lookup" 
                className="text-lg hover:text-[#F26D4B] dark:hover:text-[#F26D4B] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Lookup
              </Link>
            </nav>
          </div>
        </div>
      )}
    </React.Fragment>
  )
}