import { useState, useEffect, useCallback } from 'react'
import { Product } from 'src/types/product.type'

const STORAGE_KEY = 'recently_viewed_products'
const MAX_ITEMS = 20

export interface RecentlyViewedProduct {
  _id: string
  name: string
  image: string
  price: number
  price_before_discount: number
  rating: number
  sold: number
  viewedAt: string
}

const getStoredProducts = (): RecentlyViewedProduct[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>(() => getStoredProducts())

  // Sync across browser tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setRecentlyViewed(getStoredProducts())
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const addProduct = useCallback((product: Product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p._id !== product._id)

      const newItem: RecentlyViewedProduct = {
        _id: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        price_before_discount: product.price_before_discount,
        rating: product.rating,
        sold: product.sold,
        viewedAt: new Date().toISOString()
      }

      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeProduct = useCallback((productId: string) => {
    setRecentlyViewed((prev) => {
      const updated = prev.filter((p) => p._id !== productId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setRecentlyViewed([])
  }, [])

  return {
    recentlyViewed,
    addProduct,
    removeProduct,
    clearAll
  }
}
