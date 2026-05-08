import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from './mmkvStorage'

// Slim shop info stored locally (populated on follow/unfollow)
export interface FollowedShop {
  _id: string
  name: string
  avatar: string
  followerCount: number
  productCount: number
}

interface FollowedShopsState {
  shops: FollowedShop[]
  addShop: (shop: FollowedShop) => void
  removeShop: (shopId: string) => void
  hasShop: (shopId: string) => boolean
}

export const useFollowedShopsStore = create<FollowedShopsState>()(
  persist(
    (set, get) => ({
      shops: [],

      addShop: (shop: FollowedShop) =>
        set((state) => {
          // Deduplicate by _id
          const filtered = state.shops.filter((s) => s._id !== shop._id)
          return { shops: [shop, ...filtered] }
        }),

      removeShop: (shopId: string) =>
        set((state) => ({
          shops: state.shops.filter((s) => s._id !== shopId),
        })),

      hasShop: (shopId: string) => get().shops.some((s) => s._id === shopId),
    }),
    {
      name: 'followed-shops-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
