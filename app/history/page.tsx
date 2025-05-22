"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

export default function HistoryPage() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem("scanHistory")
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Scan History</h1>
      {history.length === 0 ? (
        <p className="text-muted-foreground">No scan history found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Model</th>
              <th></th>
              <th className="text-left py-2">Serial</th>
              <th></th>
              <th className="text-left py-2">Both</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.map((item: any, i: number) => (
              <tr key={i} className="border-b hover:bg-muted">
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
                <td className="py-2">{item.modelNumber} | {item.serialNumber}</td>
                <td>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(`${item.modelNumber} | ${item.serialNumber}`)}>
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