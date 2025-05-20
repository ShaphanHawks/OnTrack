"use client"

import { useState, useEffect } from "react"
import type { Instance } from "@/lib/types"

// Local storage key
const STORAGE_KEY = "tensordock_instances"

// Client-side storage functions
export function useLocalInstances() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load instances from localStorage on component mount
  useEffect(() => {
    try {
      const storedInstances = localStorage.getItem(STORAGE_KEY)
      if (storedInstances) {
        setInstances(JSON.parse(storedInstances))
      }
      setIsLoaded(true)
    } catch (error) {
      console.error("Failed to load instances from localStorage:", error)
      setIsLoaded(true)
    }
  }, [])

  // Save instances to localStorage whenever they change
  const saveInstances = (newInstances: Instance[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newInstances))
      setInstances(newInstances)
    } catch (error) {
      console.error("Failed to save instances to localStorage:", error)
    }
  }

  return { instances, saveInstances, isLoaded }
}

// Function to add a new instance
export function addLocalInstance(instances: Instance[], newInstance: Instance): Instance[] {
  return [...instances, newInstance]
}

// Function to delete an instance
export function deleteLocalInstance(instances: Instance[], id: string): Instance[] {
  return instances.filter((instance) => instance.id !== id)
}

// Function to update an instance
export function updateLocalInstance(instances: Instance[], id: string, updates: Partial<Instance>): Instance[] {
  return instances.map((instance) => (instance.id === id ? { ...instance, ...updates } : instance))
}
