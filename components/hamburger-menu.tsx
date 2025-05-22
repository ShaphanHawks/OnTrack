"use client"
import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"

export default function HamburgerMenu() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="absolute left-4 top-4 z-50">
      <button
        aria-label="Open menu"
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <Menu className="h-6 w-6" />
      </button>
      {menuOpen && (
        <div className="absolute mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <ul className="py-1">
            <li>
              <Link
                href="/history"
                className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMenuOpen(false)}
              >
                History
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
} 