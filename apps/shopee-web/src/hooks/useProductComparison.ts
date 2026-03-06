import { useState, useEffect, useCallback } from 'react'
import { Product } from 'src/types/product.type'

const STORAGE_KEY = 'comparison_products'
const MAX_COMPARE_ITEMS = 4

export function useProductComparison() {
  const [compareList, setCompareList] = useState<Product[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setCompareList(JSON.parse(stored))
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const addToCompare = useCallback((product: Product) => {
    setCompareList((prev) => {
      if (prev.length >= MAX_COMPARE_ITEMS) return prev
      if (prev.some((p) => p._id === product._id)) return prev
      const updated = [...prev, product]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeFromCompare = useCallback((productId: string) => {
    setCompareList((prev) => {
      const updated = prev.filter((p) => p._id !== productId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearCompare = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setCompareList([])
  }, [])

  const isInCompare = useCallback(
    (productId: string) => {
      return compareList.some((p) => p._id === productId)
    },
    [compareList]
  )

  return {
    compareList,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAddMore: compareList.length < MAX_COMPARE_ITEMS
  }
}
