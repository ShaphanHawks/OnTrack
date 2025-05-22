import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import Link from "next/link"
import { Menu } from "lucide-react"
import { useState } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Utility Tools",
  description: "Manage your GPU instances and other utilities in one place",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative min-h-screen flex flex-col">
            {/* Hamburger Menu */}
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
            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center">
              {children}
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
