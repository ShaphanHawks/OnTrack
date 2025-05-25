import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"

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
            <Header />
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
