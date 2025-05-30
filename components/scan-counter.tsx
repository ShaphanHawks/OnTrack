"use client"

import { useEffect, useState } from "react"

export function ScanCounter() {
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/get-scan-count")
        const data = await response.json()
        
        if (data.success) {
          setCount(data.count)
        } else {
          setError("Failed to fetch scan count")
        }
      } catch (err) {
        setError("Failed to fetch scan count")
      }
    }

    fetchCount()
  }, [])

  if (error) {
    return <span className="text-sm text-muted-foreground">Error loading scan count</span>
  }

  if (count === null) {
    return <span className="text-sm text-muted-foreground">Loading...</span>
  }

  return (
    <span className="text-sm text-muted-foreground">
      Total Scans: {count.toLocaleString()}
    </span>
  )
} 