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
  urlTemplate?: string
  isFavorite: boolean
  method?: 'GET' | 'POST'
  formAction?: string
  formFields?: Record<string, string>
}

const defaultProviders: LinkProvider[] = [
  {
    id: "vvappliance",
    name: "V&V Appliance Parts",
    method: 'POST',
    formAction: 'https://www.vvapplianceparts.com/lookup/',
    formFields: {
      'search': '{model}'
    },
    isFavorite: true
  },
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
  },
  {
    id: "reliableparts",
    name: "Reliable Parts",
    urlTemplate: "https://reliableparts.net/us/content/#/search/{model}",
    isFavorite: true
  },
  {
    id: "tribles",
    name: "Tribles",
    urlTemplate: "https://www.tribles.com/search?q={model}",
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

  const getUrl = (template: string | undefined, providerId: string) => {
    if (!template) return ''
    let searchTerm = modelTag
    if (providerId === "appliantology") {
      searchTerm = modelTag.slice(0, 6) + "*"
    }
    return template.replace("{model}", encodeURIComponent(searchTerm))
  }

  const handleProviderClick = (provider: LinkProvider) => {
    if (provider.method === 'POST' && provider.formAction) {
      // Create and submit a form for POST requests
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = provider.formAction
      form.target = '_blank'
      form.id = 'searchForm'

      // Add form fields
      if (provider.formFields) {
        Object.entries(provider.formFields).forEach(([name, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = name
          input.value = value.replace('{model}', encodeURIComponent(modelTag))
          console.log(`Adding form field: ${name}=${input.value}`) // Debug log
          form.appendChild(input)
        })
      }

      // Debug log the form before submission
      console.log('Form action:', form.action)
      console.log('Form method:', form.method)
      console.log('Form ID:', form.id)
      console.log('Form fields:', Array.from(form.elements).map(el => 
        el instanceof HTMLInputElement ? `${el.name}=${el.value}` : ''
      ))

      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    }
  }

  return (
    <div className={`max-w-xl mx-auto bg-white border-2 rounded-lg p-4 shadow-md hover:shadow-lg transition ${showSettings ? 'border-orange-500' : 'border-orange-500'}`}>
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
                <div key={provider.id} className="flex items-center gap-3">
                  <Checkbox
                    id={provider.id}
                    checked={provider.isFavorite}
                    onCheckedChange={() => toggleFavorite(provider.id)}
                    size="large"
                  />
                  {provider.method === 'POST' ? (
                    <a
                      href="#"
                      onClick={e => { e.preventDefault(); handleProviderClick(provider); }}
                      className="flex items-center gap-1 flex-1 text-lg font-semibold text-blue-600 underline"
                      style={{ minWidth: 0 }}
                    >
                      {provider.name}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <a
                      href={getUrl(provider.urlTemplate, provider.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 flex-1 text-lg font-semibold text-blue-600 underline"
                      style={{ minWidth: 0 }}
                    >
                      {provider.name}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            providers
              .filter(p => p.isFavorite)
              .map(provider => (
                provider.method === 'POST' ? (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderClick(provider)}
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full justify-between">
                      {provider.name}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </button>
                ) : (
                  <a
                    key={provider.id}
                    href={getUrl(provider.urlTemplate, provider.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-between">
                      {provider.name}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )
              ))
          )}
        </div>
      )}
    </div>
  )
} 