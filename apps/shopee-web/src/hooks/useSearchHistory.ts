import { useState, useEffect, useCallback } from 'react'

const SEARCH_HISTORY_KEY = 'shopee_search_history'
const MAX_HISTORY_ITEMS = 10

export interface SearchHistoryItem {
  query: string
  timestamp: number
}

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SearchHistoryItem[]
        setSearchHistory(parsed)
      } catch (e) {
        console.error('Failed to parse search history:', e)
        localStorage.removeItem(SEARCH_HISTORY_KEY)
      }
    }
  }, [])

  // Save to localStorage whenever history changes
  const saveToStorage = useCallback((history: SearchHistoryItem[]) => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
  }, [])

  // Add a search query to history
  const addToHistory = useCallback(
    (query: string) => {
      if (!query.trim()) return

      setSearchHistory((prev) => {
        // Remove duplicate if exists
        const filtered = prev.filter((item) => item.query.toLowerCase() !== query.toLowerCase())

        // Add new item at the beginning
        const newHistory = [{ query: query.trim(), timestamp: Date.now() }, ...filtered].slice(0, MAX_HISTORY_ITEMS)

        saveToStorage(newHistory)
        return newHistory
      })
    },
    [saveToStorage]
  )

  // Remove a single item from history
  const removeFromHistory = useCallback(
    (query: string) => {
      setSearchHistory((prev) => {
        const newHistory = prev.filter((item) => item.query !== query)
        saveToStorage(newHistory)
        return newHistory
      })
    },
    [saveToStorage]
  )

  // Clear all history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  }, [])

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}

export default useSearchHistory
