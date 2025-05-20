import type { Instance } from "@/lib/types"

// In-memory cache for instances (will reset on server restart)
let instancesCache: Instance[] = []

// Simple key for cache validation
const CACHE_KEY = "instances_cache_v1"

// Initialize cache from localStorage in client components if needed
export function initializeCache() {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        instancesCache = JSON.parse(cached)
      }
    } catch (error) {
      console.error("Failed to initialize cache:", error)
    }
  }
}

export async function getInstances(): Promise<Instance[]> {
  // If we're in the browser, initialize the cache
  if (typeof window !== "undefined" && instancesCache.length === 0) {
    initializeCache()
  }

  return instancesCache
}

export async function saveInstances(instances: Instance[]): Promise<void> {
  // Update in-memory cache
  instancesCache = instances

  // If we're in the browser, also save to localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(instances))
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
    }
  }
}
