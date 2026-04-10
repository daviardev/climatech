'use client'

import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isMounted, setIsMounted] = useState(false)

  // Load from localStorage after mount (client-side only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error)
    }
    setIsMounted(true)
  }, [key])

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
