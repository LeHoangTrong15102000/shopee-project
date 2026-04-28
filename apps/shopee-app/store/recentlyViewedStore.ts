import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from './mmkvStorage'
import { Product } from '@/types/product.type'

const MAX_RECENTLY_VIEWED = 20

interface RecentlyViewedState {
  products: Product[]
  addProduct: (product: Product) => void
  clearAll: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      products: [],

      addProduct: (product: Product) =>
        set((state) => {
          // Deduplicate by _id, prepend new product, slice to max
          const filtered = state.products.filter((p) => p._id !== product._id)
          return { products: [product, ...filtered].slice(0, MAX_RECENTLY_VIEWED) }
        }),

      clearAll: () => set({ products: [] }),
    }),
    {
      name: 'recently-viewed-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
