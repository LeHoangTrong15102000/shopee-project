import { useMutation, useQueryClient } from '@tanstack/react-query'

import purchaseApi from 'src/apis/purchases.api'
import { Purchase } from 'src/types/purchases.type'
import {
  SwitchVariantPayload,
  SwitchVariantContext,
  PurchasesQueryData,
  QUERY_KEYS,
} from '../shared/types'
import { cartLineMatches } from '../shared/cartLineEquality'
import { updatePurchasesCache, showErrorToast, logOptimisticError } from '../shared/utils'
import { TOAST_MESSAGES } from '../shared/constants'
import { useQueryInvalidation } from '../../useQueryInvalidation'

export const useOptimisticSwitchVariant = () => {
  const queryClient = useQueryClient()
  const { invalidateProductDetail } = useQueryInvalidation()

  return useMutation({
    mutationFn: (payload: SwitchVariantPayload) =>
      purchaseApi.updatePurchase({
        product_id: payload.product_id,
        buy_count: payload.buy_count ?? 1,
        sku_id: payload.sku_id,
        target_sku_id: payload.target_sku_id,
      }),

    onMutate: async (payload: SwitchVariantPayload): Promise<SwitchVariantContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.PURCHASES_IN_CART })

      const previousData = queryClient.getQueryData(QUERY_KEYS.PURCHASES_IN_CART)

      updatePurchasesCache(queryClient, QUERY_KEYS.PURCHASES_IN_CART, (old) => {
        const purchases: Purchase[] = old.data?.data ?? []

        // Locate source and (possibly) existing target lines
        const sourceLine = purchases.find((p) =>
          cartLineMatches(p, payload.product_id, payload.sku_id),
        )
        const targetLine = purchases.find((p) =>
          cartLineMatches(p, payload.product_id, payload.target_sku_id),
        )

        if (!sourceLine) return old

        let updatedPurchases: Purchase[]

        if (targetLine) {
          // Merge path: sum buy_counts into the existing target line, remove source
          const mergedBuyCount = (payload.buy_count ?? sourceLine.buy_count) + targetLine.buy_count
          updatedPurchases = purchases
            .filter((p) => !cartLineMatches(p, payload.product_id, payload.sku_id))
            .map((p) =>
              cartLineMatches(p, payload.product_id, payload.target_sku_id)
                ? { ...p, buy_count: mergedBuyCount }
                : p,
            )
        } else {
          // Switch-in-place path: rewrite source line's sku and price to target
          updatedPurchases = purchases.map((p) => {
            if (!cartLineMatches(p, payload.product_id, payload.sku_id)) return p
            return {
              ...p,
              buy_count: payload.buy_count ?? p.buy_count,
              // Update price fields if the caller supplied them; they will be
              // corrected authoritatively on server response via onSettled refetch.
              ...(payload.target_price !== undefined ? { price: payload.target_price } : {}),
              ...(payload.target_price_before_discount !== undefined
                ? { price_before_discount: payload.target_price_before_discount }
                : {}),
              // Rewrite the sku so the cart row reflects the new variant immediately.
              // _id locates the line; value/image/variant_values drive the visible label.
              sku: {
                ...(p.sku ?? {}),
                _id: payload.target_sku_id,
                ...(payload.target_value !== undefined ? { value: payload.target_value } : {}),
                ...(payload.target_image !== undefined ? { image: payload.target_image } : {}),
                ...(payload.target_variant_values !== undefined
                  ? { variant_values: payload.target_variant_values }
                  : {}),
              },
            }
          })
        }

        return {
          ...old,
          data: {
            ...old.data,
            data: updatedPurchases,
          },
        }
      })

      return {
        previousData: previousData as PurchasesQueryData | undefined,
        product_id: payload.product_id,
      }
    },

    onError: (err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, context.previousData)
      }
      showErrorToast(TOAST_MESSAGES.UPDATE_QUANTITY_ERROR)
      logOptimisticError('Switch variant', err, context)
    },

    onSuccess: () => {
      // Optimistic update already handled the UI — server data syncs via onSettled invalidation
    },

    onSettled: (_data, _error, variables) => {
      // Only invalidate product detail (stock info) — not the cart,
      // mirroring useOptimisticUpdateQuantity behaviour.
      if (variables.product_id) {
        invalidateProductDetail(variables.product_id)
      }
    },
  })
}
