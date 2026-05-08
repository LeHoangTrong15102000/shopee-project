import { useMutation, useQueryClient } from '@tanstack/react-query'
import { unfollowShop } from '@/apis/shop.api'
import { useFollowedShopsStore } from '@/store/followedShopsStore'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Returns the list of followed shops from the local Zustand store.
 * The store is populated when the user follows/unfollows a shop via useFollowShop.
 */
export function useFollowedShopsList() {
  return useFollowedShopsStore((state) => state.shops)
}

/**
 * Unfollow a shop: calls the API, then removes it from the local store.
 */
export function useUnfollowShop() {
  const queryClient = useQueryClient()
  const removeShop = useFollowedShopsStore((state) => state.removeShop)

  return useMutation({
    mutationFn: (shopId: string) => unfollowShop(shopId),
    onSuccess: (_data, shopId) => {
      removeShop(shopId)
      queryClient.invalidateQueries({ queryKey: ['shop', shopId] })
    },
    onError: handleMutationError,
  })
}
