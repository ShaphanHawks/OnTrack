import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import HamburgerMenu from "@/components/hamburger-menu"
import Link from "next/link"

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
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative min-h-screen flex flex-col">
            {/* Masthead */}
            <header className="w-full py-4 bg-white dark:bg-gray-900 flex justify-between items-center px-4">
              <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white hover:underline">
                Utility Tools
              </Link>
              <HamburgerMenu />
            </header>
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
