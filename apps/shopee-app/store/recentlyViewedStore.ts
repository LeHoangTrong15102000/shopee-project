import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from './mmkvStorage'
import { Product } from '@/types/product.type'

const MAX_RECENTLY_VIEWED = 20

// Slim type containing only fields needed for display in RecentlyViewedSection
// and ProductCard. Avoids persisting the full Product object (images array,
// category, timestamps, quantity, view, etc.).
export interface RecentlyViewedProduct {
  _id: string
  name: string
  image: string
  price: number
  price_before_discount: number
  rating: number
  sold: number
}

function toSlim(product: Product): RecentlyViewedProduct {
  return {
    _id: product._id,
    name: product.name,
    image: product.image,
    price: product.price,
    price_before_discount: product.price_before_discount,
    rating: product.rating,
    sold: product.sold,
  }
}

interface RecentlyViewedState {
  products: RecentlyViewedProduct[]
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
          const slim = toSlim(product)
          const filtered = state.products.filter((p) => p._id !== slim._id)
          return { products: [slim, ...filtered].slice(0, MAX_RECENTLY_VIEWED) }
        }),

      clearAll: () => set({ products: [] }),
    }),
    {
      name: 'recently-viewed-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
