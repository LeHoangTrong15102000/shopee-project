import { useMutation, useQueryClient } from '@tanstack/react-query'
import { followShop, unfollowShop } from '@/apis/shop.api'
import { Shop } from '@/types/shop.type'
import { useFollowedShopsStore } from '@/store/followedShopsStore'

export function useFollowShop(shopId: string) {
  const queryClient = useQueryClient()
  const addShop = useFollowedShopsStore((state) => state.addShop)
  const removeShop = useFollowedShopsStore((state) => state.removeShop)

  return useMutation({
    mutationFn: (isCurrentlyFollowing: boolean) =>
      isCurrentlyFollowing ? unfollowShop(shopId) : followShop(shopId),

    onMutate: async (isCurrentlyFollowing) => {
      await queryClient.cancelQueries({ queryKey: ['shop', shopId] })
      const previous = queryClient.getQueryData<Shop>(['shop', shopId])

      queryClient.setQueryData<Shop>(['shop', shopId], (old) => {
        if (!old) return old
        return {
          ...old,
          isFollowing: !isCurrentlyFollowing,
          followerCount: isCurrentlyFollowing
            ? old.followerCount - 1
            : old.followerCount + 1,
        }
      })

      return { previous }
    },

    onSuccess: (_data, isCurrentlyFollowing) => {
      const shop = queryClient.getQueryData<Shop>(['shop', shopId])
      if (isCurrentlyFollowing) {
        // Unfollowed — remove from store
        removeShop(shopId)
      } else if (shop) {
        // Followed — add to store
        addShop({
          _id: shop._id,
          name: shop.name,
          avatar: shop.avatar,
          followerCount: shop.followerCount,
          productCount: shop.productCount,
        })
      }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['shop', shopId], context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', shopId] })
    },
  })
}
