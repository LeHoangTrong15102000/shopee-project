import { useState, useCallback, useEffect } from 'react'
import { Product } from 'src/types/product.type'

const STORAGE_KEY = 'shopee_saved_for_later'

export interface SavedItem {
  product: Product
  savedAt: string
  originalBuyCount: number
}

/**
 * Hook to manage "Save for Later" functionality
 * Persists saved items to localStorage
 */
export const useSaveForLater = () => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Sync to localStorage whenever savedItems changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems))
    } catch (error) {
      console.warn('Failed to save items to localStorage:', error)
    }
  }, [savedItems])

  /**
   * Save a product for later
   * @param product - The product to save
   * @param buyCount - The original quantity in cart
   * @returns true if saved successfully, false if already exists
   */
  const saveForLater = useCallback((product: Product, buyCount: number): boolean => {
    let wasAdded = false
    setSavedItems((prev) => {
      // Don't add duplicates
      if (prev.some((item) => item.product._id === product._id)) {
        return prev
      }
      wasAdded = true
      return [
        ...prev,
        {
          product,
          savedAt: new Date().toISOString(),
          originalBuyCount: buyCount
        }
      ]
    })
    return wasAdded
  }, [])

  /**
   * Remove a product from saved items
   * @param productId - The product ID to remove
   */
  const removeFromSaved = useCallback((productId: string) => {
    setSavedItems((prev) => prev.filter((item) => item.product._id !== productId))
  }, [])

  /**
   * Clear all saved items
   */
  const clearSaved = useCallback(() => {
    setSavedItems([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  /**
   * Check if a product is already saved
   * @param productId - The product ID to check
   */
  const isSaved = useCallback(
    (productId: string): boolean => {
      return savedItems.some((item) => item.product._id === productId)
    },
    [savedItems]
  )

  /**
   * Get a saved item by product ID
   * @param productId - The product ID to find
   */
  const getSavedItem = useCallback(
    (productId: string): SavedItem | undefined => {
      return savedItems.find((item) => item.product._id === productId)
    },
    [savedItems]
  )

  return {
    savedItems,
    saveForLater,
    removeFromSaved,
    clearSaved,
    isSaved,
    getSavedItem,
    savedCount: savedItems.length
  }
}

export default useSaveForLater
