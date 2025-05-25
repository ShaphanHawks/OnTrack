"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="bg-white w-full">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="text-xl font-semibold">OnTrack Tools</div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#F26D4B] text-white p-2 rounded-full z-50"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute inset-0 bg-white z-40 px-6 py-20 flex flex-col space-y-6 text-lg">
          <Link href="/scan" className="hover:text-[#F26D4B] transition-colors">Scan</Link>
          <Link href="/history" className="hover:text-[#F26D4B] transition-colors">History</Link>
          <Link href="/lookup" className="hover:text-[#F26D4B] transition-colors">Lookup</Link>
        </div>
      )}
    </header>
  )
} 