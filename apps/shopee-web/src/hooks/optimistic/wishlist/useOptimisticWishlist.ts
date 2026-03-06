import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext } from 'react'

import wishlistApi from 'src/apis/wishlist.api'
import { AppContext } from 'src/contexts/app.context'
import { WishlistContext, WishlistCheckQueryData, WishlistCountQueryData, QUERY_KEYS } from '../shared/types'
import { showSuccessToast, showErrorToast, logOptimisticError } from '../shared/utils'
import { TOAST_MESSAGES } from '../shared/constants'

export const useOptimisticWishlist = (productId: string) => {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useContext(AppContext)

  const { data: checkData, isLoading: isChecking } = useQuery({
    queryKey: QUERY_KEYS.WISHLIST_CHECK(productId),
    queryFn: () => wishlistApi.checkInWishlist(productId),
    enabled: isAuthenticated,
    staleTime: 30 * 1000
  })

  const isInWishlist = checkData?.data?.data?.in_wishlist ?? false

  const addMutation = useMutation({
    mutationFn: () => wishlistApi.addToWishlist({ product_id: productId }),
    onMutate: async (): Promise<WishlistContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.WISHLIST_CHECK(productId) })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.WISHLIST })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.WISHLIST_COUNT })

      const previousWishlistCheck = queryClient.getQueryData(QUERY_KEYS.WISHLIST_CHECK(productId))
      const previousWishlistData = queryClient.getQueryData(QUERY_KEYS.WISHLIST)
      const previousWishlistCount = queryClient.getQueryData(QUERY_KEYS.WISHLIST_COUNT)

      queryClient.setQueryData(QUERY_KEYS.WISHLIST_CHECK(productId), (old: WishlistCheckQueryData | undefined) => ({
        ...old,
        data: { ...old?.data, data: { in_wishlist: true } }
      }))

      queryClient.setQueryData(QUERY_KEYS.WISHLIST_COUNT, (old: WishlistCountQueryData | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: { ...old.data, data: { count: (old.data?.data?.count || 0) + 1 } }
        }
      })

      showSuccessToast(TOAST_MESSAGES.WISHLIST_ADD_SUCCESS)

      return { previousWishlistCheck, previousWishlistData, previousWishlistCount, productId }
    },
    onError: (err, _, context) => {
      if (context?.previousWishlistCheck) {
        queryClient.setQueryData(QUERY_KEYS.WISHLIST_CHECK(productId), context.previousWishlistCheck)
      }
      if (context?.previousWishlistCount) {
        queryClient.setQueryData(QUERY_KEYS.WISHLIST_COUNT, context.previousWishlistCount)
      }

      showErrorToast(TOAST_MESSAGES.WISHLIST_ADD_ERROR)
      logOptimisticError('Add to wishlist', err, context)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLIST })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLIST_CHECK(productId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLIST_COUNT })
    }
  })

  const removeMutation = useMutation({
    mutationFn: () => wishlistApi.removeFromWishlist(productId),
    onMutate: async (): Promise<WishlistContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.WISHLIST_CHECK(productId) })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.WISHLIST })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.WISHLIST_COUNT })

      const previousWishlistCheck = queryClient.getQueryData(QUERY_KEYS.WISHLIST_CHECK(productId))
      const previousWishlistData = queryClient.getQueryData(QUERY_KEYS.WISHLIST)
      const previousWishlistCount = queryClient.getQueryData(QUERY_KEYS.WISHLIST_COUNT)

      queryClient.setQueryData(QUERY_KEYS.WISHLIST_CHECK(productId), (old: WishlistCheckQueryData | undefined) => ({
        ...old,
        data: { ...old?.data, data: { in_wishlist: false } }
      }))

      queryClient.setQueryData(QUERY_KEYS.WISHLIST_COUNT, (old: WishlistCountQueryData | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: { ...old.data, data: { count: Math.max((old.data?.data?.count || 1) - 1, 0) } }
        }
      })

      showSuccessToast(TOAST_MESSAGES.WISHLIST_REMOVE_SUCCESS)

      return { previousWishlistCheck, previousWishlistData, previousWishlistCount, productId }
    },
    onError: (err, _, context) => {
      if (context?.previousWishlistCheck) {
        queryClient.setQueryData(QUERY_KEYS.WISHLIST_CHECK(productId), context.previousWishlistCheck)
      }
      if (context?.previousWishlistCount) {
        queryClient.setQueryData(QUERY_KEYS.WISHLIST_COUNT, context.previousWishlistCount)
      }

      showErrorToast(TOAST_MESSAGES.WISHLIST_REMOVE_ERROR)
      logOptimisticError('Remove from wishlist', err, context)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLIST })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLIST_CHECK(productId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLIST_COUNT })
    }
  })

  const toggleWishlist = () => {
    if (isInWishlist) {
      removeMutation.mutate()
    } else {
      addMutation.mutate()
    }
  }

  const isLoading = isChecking || addMutation.isPending || removeMutation.isPending

  return {
    isInWishlist,
    isLoading,
    isChecking,
    isAuthenticated,
    addMutation,
    removeMutation,
    toggleWishlist
  }
}
