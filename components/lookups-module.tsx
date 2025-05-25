"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, ChevronDown, ChevronRight, Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { ReactElement } from "react"

interface LookupsModuleProps {
  modelTag: string
}

const STORAGE_KEY = "lookupsModuleOpen"
const FAVORITES_KEY = "lookupsFavorites"

interface LinkProvider {
  id: string
  name: string
  urlTemplate: string
  isFavorite: boolean
}

const defaultProviders: LinkProvider[] = [
  {
    id: "partsdr",
    name: "PartsDr",
    urlTemplate: "https://partsdr.com/model-number-search?query={model}",
    isFavorite: true
  },
  {
    id: "appliancepartspros",
    name: "AppliancePartsPros",
    urlTemplate: "https://www.appliancepartspros.com/search.aspx?model={model}",
    isFavorite: true
  },
  {
    id: "partselect",
    name: "PartsSelect",
    urlTemplate: "https://www.partselect.com/Models/{model}",
    isFavorite: true
  },
  {
    id: "encompass",
    name: "Encompass",
    urlTemplate: "https://encompass.com/search?searchTerm={model}",
    isFavorite: true
  },
  {
    id: "searspartsdirect",
    name: "SearsPartsDirect",
    urlTemplate: "https://www.searspartsdirect.com/search?q={model}",
    isFavorite: true
  },
  {
    id: "marcone",
    name: "Marcone",
    urlTemplate: "https://my.marcone.com/Home/RunSearchPartModelList?searchString={model}",
    isFavorite: true
  },
  {
    id: "appliantology",
    name: "Appliantology",
    urlTemplate: "https://appliantology.org/search/?&q={model}&quick=1&search_and_or=and&sortby=relevancy",
    isFavorite: true
  },
  {
    id: "servicematters",
    name: "Service Matters",
    urlTemplate: "https://servicematters.com/en_US/search?query={model}",
    isFavorite: true
  }
]

export function LookupsModule({ modelTag }: LookupsModuleProps): ReactElement {
  const [open, setOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [providers, setProviders] = useState<LinkProvider[]>(defaultProviders)

  // Load persisted states
  useEffect(() => {
    const persistedOpen = localStorage.getItem(STORAGE_KEY)
    if (persistedOpen !== null) setOpen(persistedOpen === "true")

    const persistedFavorites = localStorage.getItem(FAVORITES_KEY)
    if (persistedFavorites) {
      const favorites = JSON.parse(persistedFavorites)
      setProviders(prev => prev.map(p => ({
        ...p,
        isFavorite: favorites[p.id] ?? p.isFavorite
      })))
    }
  }, [])

  // Persist states on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, open ? "true" : "false")
  }, [open])

  useEffect(() => {
    const favorites = providers.reduce((acc, p) => ({
      ...acc,
      [p.id]: p.isFavorite
    }), {})
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [providers])

  const toggleFavorite = (providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, isFavorite: !p.isFavorite } : p
    ))
  }

  const getUrl = (template: string) => {
    return template.replace("{model}", encodeURIComponent(modelTag))
  }

  return (
    <div className="max-w-xl mx-auto bg-white border-2 border-[#FAD9CC] rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Lookups</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded hover:opacity-80 transition-opacity"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
        <button onClick={() => setOpen(o => !o)}>
          {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>
      
      {open && (
        <div className="space-y-2">
          {showSettings ? (
            <div className="space-y-2">
              {providers.map(provider => (
                <div key={provider.id} className="flex items-center gap-2">
                  <Checkbox
                    id={provider.id}
                    checked={provider.isFavorite}
                    onCheckedChange={() => toggleFavorite(provider.id)}
                  />
                  <label
                    htmlFor={provider.id}
                    className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {provider.name}
                  </label>
                  <a
                    href={getUrl(provider.urlTemplate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Test Link
                  </a>
                </div>
              ))}
            </div>
          ) : (
            providers
              .filter(p => p.isFavorite)
              .map(provider => (
                <a
                  key={provider.id}
                  href={getUrl(provider.urlTemplate)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-between">
                    {provider.name}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              ))
          )}
        </div>
      )}
    </div>
  )
} 