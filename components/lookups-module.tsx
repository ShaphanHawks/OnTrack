"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import type { ReactElement } from "react"

interface LookupsModuleProps {
  modelTag: string
}

export function LookupsModule({ modelTag }: LookupsModuleProps): ReactElement {
  return (
    <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Lookups</h2>
      <div className="space-y-4">
        <a 
          href={`https://www.searspartsdirect.com/search?q=${encodeURIComponent(modelTag)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="outline" className="w-full justify-between">
            SearsPartsDirect
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
        <a 
          href={`https://www.facebook.com/search/posts?q=${encodeURIComponent(modelTag)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="outline" className="w-full justify-between">
            Facebook Lookup
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  )
} 