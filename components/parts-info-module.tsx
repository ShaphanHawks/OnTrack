"use client"

import { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, ChevronDown, ChevronRight, Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { ReactElement } from "react"
import { Dialog } from "@/components/ui/dialog"

const STORAGE_KEY = "partsReviewsModuleOpen"
const FAVORITES_KEY = "partsReviewsFavorites"

interface LinkProvider {
  id: string
  name: string
  urlTemplate: string
  isFavorite: boolean
}

const defaultProviders: LinkProvider[] = [
  {
    id: "amazon",
    name: "Amazon",
    urlTemplate: "https://www.amazon.com/s?k={part}",
    isFavorite: true
  },
  {
    id: "partsdr",
    name: "PartsDr",
    urlTemplate: "https://partsdr.com/part/{part}",
    isFavorite: true
  },
  {
    id: "searspartsdirect",
    name: "SearsPartsDirect",
    urlTemplate: "https://www.searspartsdirect.com/search?q={part}",
    isFavorite: true
  },
  {
    id: "appliancepartspros",
    name: "AppliancePartsPros",
    urlTemplate: "https://www.appliancepartspros.com/search.aspx?p={part}",
    isFavorite: true
  },
  {
    id: "repairclinic",
    name: "Repair Clinic",
    urlTemplate: "https://www.repairclinic.com/Shop-For-Parts?query={part}",
    isFavorite: true
  },
  {
    id: "reliableparts",
    name: "Reliable Parts",
    urlTemplate: "https://reliableparts.net/us/content/#/search/{part}",
    isFavorite: true
  },
  {
    id: "bensappliances",
    name: "Ben's Appliances",
    urlTemplate: "https://bens-appliances.com/search?type=product&options%5Bprefix%5D=last&options%5Bunavailable_products%5D=last&q={part}",
    isFavorite: true
  }
]

export function PartsReviewsModule(): ReactElement {
  const [partNumber, setPartNumber] = useState<string>("")
  const [submittedPartNumber, setSubmittedPartNumber] = useState<string>("")
  const [open, setOpen] = useState<boolean>(true)
  const [showSettings, setShowSettings] = useState(false)
  const [providers, setProviders] = useState<LinkProvider[]>(defaultProviders)
  const openAllButtonRef = useRef<HTMLButtonElement>(null)

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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPartNumber(e.target.value)
  }

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    setSubmittedPartNumber(partNumber)
  }

  const toggleOpen = (): void => {
    setOpen((prevOpen: boolean) => !prevOpen)
  }

  const toggleFavorite = (providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, isFavorite: !p.isFavorite } : p
    ))
  }

  const getUrl = (template: string) => {
    return template.replace("{part}", encodeURIComponent(submittedPartNumber))
  }

  // Open all links in new tabs
  const handleOpenAll = (links: string[]) => {
    links.forEach((url, i) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  return (
    <div className="w-[90vw] max-w-xl sm:mx-auto mx-[5vw] bg-white border border-orange-500 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Parts Reviews</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded hover:opacity-80 transition-opacity"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
        <button onClick={toggleOpen}>
          {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>
      
      {open && (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter part number"
              value={partNumber}
              onChange={handleInputChange}
              className="w-full"
            />
            {/* Button row: only show Open ALL after search */}
            {submittedPartNumber ? (
              <div className="flex gap-2 w-full">
                <Button type="submit" className="w-1/2 text-lg font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
                  Search
                </Button>
                <Button
                  type="button"
                  className="w-1/2 text-lg font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#F26D4B', color: '#fff' }}
                  onClick={() => {
                    const links = showSettings
                      ? providers.map(p => getUrl(p.urlTemplate))
                      : providers.filter(p => p.isFavorite).map(p => getUrl(p.urlTemplate));
                    handleOpenAll(links);
                  }}
                >
                  Open All
                  <ExternalLink className="h-5 w-5" color="#fff" />
                  <ExternalLink className="h-5 w-5" color="#fff" />
                  <ExternalLink className="h-5 w-5" color="#fff" />
                </Button>
              </div>
            ) : (
              <Button type="submit" className="w-full text-lg font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
                Search
              </Button>
            )}
          </form>
          
          {submittedPartNumber && (
            <div className="space-y-2">
              {showSettings ? (
                <div className="space-y-2">
                  {providers.map(provider => (
                    <div key={provider.id} className="flex items-center gap-3">
                      <Checkbox
                        id={provider.id}
                        checked={provider.isFavorite}
                        onCheckedChange={() => toggleFavorite(provider.id)}
                        size="large"
                      />
                      <a
                        href={getUrl(provider.urlTemplate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 flex-1 text-lg font-semibold text-blue-600 underline"
                        style={{ minWidth: 0 }}
                      >
                        {provider.name}
                        <ExternalLink className="h-4 w-4" />
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
      )}
    </div>
  )
} 