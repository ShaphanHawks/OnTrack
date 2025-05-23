"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

function formatDate(dateNum: number) {
  const d = new Date(dateNum)
  return d.toLocaleString()
}

export default function HistoryPage() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem("scanHistory")
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Show only the most recent 100 scans, most recent first
  const limitedHistory = [...history].reverse().slice(0, 100)

  const handleClearHistory = () => {
    if (window.confirm("Are you sure? This can't be reversed.")) {
      localStorage.removeItem("scanHistory")
      setHistory([])
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Scan History</h1>
      <p className="text-muted-foreground mb-6">Past 100 scans</p>
      {limitedHistory.length > 0 && (
        <Button variant="destructive" className="mb-4" onClick={handleClearHistory}>
          Clear History
        </Button>
      )}
      {limitedHistory.length === 0 ? (
        <p className="text-muted-foreground">No scan history found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Date</th>
              <th className="text-left py-2">Model</th>
              <th></th>
              <th className="text-left py-2">Serial</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {limitedHistory.map((item: any, i: number) => (
              <tr key={i} className="border-b hover:bg-muted">
                <td className="py-2">{formatDate(item.date)}</td>
                <td className="py-2">{item.modelNumber}</td>
                <td>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(item.modelNumber)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </td>
                <td className="py-2">{item.serialNumber}</td>
                <td>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(item.serialNumber)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
} 