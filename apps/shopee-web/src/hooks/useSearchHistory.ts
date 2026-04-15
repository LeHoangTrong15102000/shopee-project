import { useState, useEffect } from 'react'

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

  const saveToStorage = (history: SearchHistoryItem[]) => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
  }

  const addToHistory = (query: string) => {
    if (!query.trim()) return

    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== query.toLowerCase())

      const newHistory = [{ query: query.trim(), timestamp: Date.now() }, ...filtered].slice(
        0,
        MAX_HISTORY_ITEMS,
      )

      saveToStorage(newHistory)
      return newHistory
    })
  }

  const removeFromHistory = (query: string) => {
    setSearchHistory((prev) => {
      const newHistory = prev.filter((item) => item.query !== query)
      saveToStorage(newHistory)
      return newHistory
    })
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  }

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
}

export default useSearchHistory
