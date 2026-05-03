import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWishlist, removeFromWishlist, type WishlistPage } from '@/apis/wishlist.api'
import type { InfiniteData } from '@tanstack/react-query'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Types ────────────────────────────────────────────────────────────────────

type WishlistResponse = { message: string; data: WishlistPage }

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const wishlistKeys = {
  all: () => ['wishlist-list'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useWishlist() {
  return useInfiniteQuery({
    queryKey: wishlistKeys.all(),
    queryFn: ({ pageParam }) => getWishlist(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.data.pagination
      return page < total_pages ? page + 1 : undefined
    },
  })
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => removeFromWishlist(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.all() })
      const previous = queryClient.getQueryData(wishlistKeys.all())
      queryClient.setQueryData(
        wishlistKeys.all(),
        (old: InfiniteData<WishlistResponse> | undefined) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                items: page.data.items.filter((item) => item.product._id !== productId),
              },
            })),
          }
        }
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(wishlistKeys.all(), context.previous)
      }
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all() })
    },
  })
}
