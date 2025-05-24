"use client"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

interface ScanPageProps {
  modelTag: string
  serialTag: string
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

export default function ScanPage({ modelTag, serialTag }: ScanPageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Model Tag</h3>
        <div className="flex items-center gap-2">
          <p className="text-lg">{modelTag}</p>
          <Button size="icon" variant="ghost" onClick={() => copyToClipboard(modelTag)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Lookups</h3>
        <div className="space-y-2">
          <a 
            href={`https://www.searspartsdirect.com/search?q=${modelTag}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline block"
          >
            SearsPartsDirect
          </a>
          <a 
            href={`https://www.facebook.com/search/posts/?q=${modelTag}&filters=eyJyYc9hdXRob3I6MCI6IntcIm5hbWVcIjpcIm15X2dyb3Vw19hbmRfcGFnZXNcIn0ifQ`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline block"
          >
            Facebook Lookup
          </a>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Serial Tag</h3>
        <div className="flex items-center gap-2">
          <p className="text-lg">{serialTag}</p>
          <Button size="icon" variant="ghost" onClick={() => copyToClipboard(serialTag)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 