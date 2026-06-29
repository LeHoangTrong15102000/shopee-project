import { useMutation, useQueryClient } from '@tanstack/react-query'

import purchaseApi from 'src/apis/purchases.api'
import { useCartStore } from 'src/stores/cart.store'
import { Purchase } from 'src/types/purchases.type'
import {
  UpdateQuantityPayload,
  UpdateQuantityContext,
  PurchasesQueryData,
  QUERY_KEYS,
} from '../shared/types'
import { cartLineMatches } from '../shared/cartLineEquality'
import { updatePurchasesCache, showErrorToast, logOptimisticError } from '../shared/utils'
import { TOAST_MESSAGES } from '../shared/constants'
import { useQueryInvalidation } from '../../useQueryInvalidation'

export const useOptimisticUpdateQuantity = () => {
  const queryClient = useQueryClient()
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const { invalidateProductDetail } = useQueryInvalidation()

  return useMutation({
    mutationFn: purchaseApi.updatePurchase,
    onMutate: async ({
      product_id,
      buy_count,
      sku_id,
    }: UpdateQuantityPayload): Promise<UpdateQuantityContext> => {
      // Hủy queries đang chờ
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.PURCHASES_IN_CART,
      })

      const previousData = queryClient.getQueryData(QUERY_KEYS.PURCHASES_IN_CART)

      // Cập nhật cache optimistically — target only the line matching product AND sku
      updatePurchasesCache(queryClient, QUERY_KEYS.PURCHASES_IN_CART, (old) => ({
        ...old,
        data: {
          ...old.data,
          data:
            old.data?.data?.map((purchase: Purchase) =>
              cartLineMatches(purchase, product_id, sku_id) ? { ...purchase, buy_count } : purchase,
            ) || [],
        },
      }))

      // Cập nhật context state optimistically (variant-aware)
      updateQuantity(product_id, buy_count, sku_id ?? null)

      return { previousData: previousData as PurchasesQueryData | undefined, product_id, sku_id }
    },

    onError: (err, _variables, context) => {
      // Rollback changes
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, context.previousData)
      }

      // Rollback context state (variant-aware)
      if (context?.previousData && context?.product_id) {
        const productId = context.product_id
        const skuId = context.sku_id
        const originalItem = (
          context.previousData as PurchasesQueryData | undefined
        )?.data?.data?.find((p: Purchase) => cartLineMatches(p, productId, skuId))
        if (originalItem) {
          updateQuantity(productId, originalItem.buy_count, skuId ?? null)
        }
      }

      showErrorToast(TOAST_MESSAGES.UPDATE_QUANTITY_ERROR)
      logOptimisticError('Update quantity', err, context)
    },

    onSuccess: (_data, _variables) => {
      // Optimistic update đã xử lý UI rồi — không cần setExtendedPurchases lại
      // Server data sẽ được sync qua onSettled invalidation
    },

    onSettled: (_data, _error, variables) => {
      // Chỉ invalidate product detail (stock info) — KHÔNG invalidate cart
      // vì optimistic update đã cập nhật đúng buy_count rồi.
      // invalidateCart() ở đây gây re-fetch → useEffect → setExtendedPurchases → re-render thừa
      if (variables.product_id) {
        invalidateProductDetail(variables.product_id)
      }
    },
  })
}
