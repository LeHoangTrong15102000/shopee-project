import { useState, useMemo, useCallback } from 'react'
import { Purchase } from 'src/types/purchases.type'

export interface OrderFilters {
  searchQuery: string
  dateRange: { from: string; to: string } | null
  priceRange: { min: number; max: number } | null
}

export interface UseOrderFilterReturn {
  filters: OrderFilters
  setSearchQuery: (query: string) => void
  setDateRange: (range: { from: string; to: string } | null) => void
  setPriceRange: (range: { min: number; max: number } | null) => void
  clearAllFilters: () => void
  activeFilterCount: number
  filterPurchases: (purchases: Purchase[]) => Purchase[]
}

const initialFilters: OrderFilters = {
  searchQuery: '',
  dateRange: null,
  priceRange: null
}

export function useOrderFilter(): UseOrderFilterReturn {
  const [filters, setFilters] = useState<OrderFilters>(initialFilters)

  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }))
  }, [])

  const setDateRange = useCallback((range: { from: string; to: string } | null) => {
    setFilters((prev) => ({ ...prev, dateRange: range }))
  }, [])

  const setPriceRange = useCallback((range: { min: number; max: number } | null) => {
    setFilters((prev) => ({ ...prev, priceRange: range }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.searchQuery.trim()) count++
    if (filters.dateRange) count++
    if (filters.priceRange) count++
    return count
  }, [filters])

  const filterPurchases = useCallback(
    (purchases: Purchase[]): Purchase[] => {
      if (!purchases) return []

      return purchases.filter((purchase) => {
        // Search query filter - match against product name (case-insensitive)
        if (filters.searchQuery.trim()) {
          const normalizedQuery = filters.searchQuery.toLowerCase().trim()
          if (!purchase.product.name.toLowerCase().includes(normalizedQuery)) {
            return false
          }
        }

        // Date range filter - filter by purchase createdAt date
        if (filters.dateRange) {
          const purchaseDate = new Date(purchase.createdAt)
          const fromDate = new Date(filters.dateRange.from)
          const toDate = new Date(filters.dateRange.to)

          // Set time to start/end of day for accurate comparison
          fromDate.setHours(0, 0, 0, 0)
          toDate.setHours(23, 59, 59, 999)

          if (purchaseDate < fromDate || purchaseDate > toDate) {
            return false
          }
        }

        // Price range filter - filter by total price (price * buy_count)
        if (filters.priceRange) {
          const totalPrice = purchase.product.price * purchase.buy_count
          if (totalPrice < filters.priceRange.min || totalPrice > filters.priceRange.max) {
            return false
          }
        }

        return true
      })
    },
    [filters]
  )

  return {
    filters,
    setSearchQuery,
    setDateRange,
    setPriceRange,
    clearAllFilters,
    activeFilterCount,
    filterPurchases
  }
}

export default useOrderFilter
