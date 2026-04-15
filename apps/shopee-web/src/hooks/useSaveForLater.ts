import { useState, useEffect } from 'react'
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
  const saveForLater = (product: Product, buyCount: number): boolean => {
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
          originalBuyCount: buyCount,
        },
      ]
    })
    return wasAdded
  }

  const removeFromSaved = (productId: string) => {
    setSavedItems((prev) => prev.filter((item) => item.product._id !== productId))
  }

  const clearSaved = () => {
    setSavedItems([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const isSaved = (productId: string): boolean => {
    return savedItems.some((item) => item.product._id === productId)
  }

  const getSavedItem = (productId: string): SavedItem | undefined => {
    return savedItems.find((item) => item.product._id === productId)
  }

  return {
    savedItems,
    saveForLater,
    removeFromSaved,
    clearSaved,
    isSaved,
    getSavedItem,
    savedCount: savedItems.length,
  }
}

export default useSaveForLater
