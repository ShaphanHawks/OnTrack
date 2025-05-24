"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-900 p-4 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <nav className="flex flex-col space-y-4 mt-16">
              <Link 
                href="/scan" 
                className="text-lg hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => setIsOpen(false)}
              >
                Scan
              </Link>
              <Link 
                href="/history" 
                className="text-lg hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => setIsOpen(false)}
              >
                History
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}