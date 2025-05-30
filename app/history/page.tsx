"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useRouter } from "next/navigation"

interface ScanHistoryItem {
  date: number
  modelNumber: string
  serialNumber: string
}

function formatDate(dateNum: number) {
  const d = new Date(dateNum)
  return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const router = useRouter()

  useEffect(() => {
    const loadHistory = () => {
      const saved = localStorage.getItem("scanHistory");
      console.log("[HistoryPage] Raw scanHistory from localStorage:", saved);
      if (saved) setHistory(JSON.parse(saved));
      else setHistory([]);
    };

    loadHistory();

    // Listen for route changes
    const handleRouteChange = () => {
      loadHistory();
    };
    router.events?.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events?.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleModelClick = (modelNumber: string, serialNumber: string) => {
    // Store the selected model and serial in localStorage for the home page to use
    localStorage.setItem("selectedModel", modelNumber)
    localStorage.setItem("selectedSerial", serialNumber)
    // Navigate to home page
    router.push("/")
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
            {limitedHistory.map((item: ScanHistoryItem, i: number) => (
              <tr key={i} className="border-b hover:bg-muted">
                <td className="py-2">{formatDate(item.date)}</td>
                <td className="py-2">
                  <button
                    onClick={() => handleModelClick(item.modelNumber, item.serialNumber)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {item.modelNumber}
                  </button>
                </td>
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