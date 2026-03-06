import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import purchaseApi from 'src/apis/purchases.api'
import { useCartStore } from 'src/stores/cart.store'
import { Purchase } from 'src/types/purchases.type'
import { RemoveFromCartContext, PurchasesQueryData, QUERY_KEYS } from '../shared/types'
import {
  updatePurchasesCache,
  createExtendedPurchase,
  showErrorToast,
  showSuccessToast,
  showInfoToast,
  logOptimisticError
} from '../shared/utils'
import { TOAST_MESSAGES } from '../shared/constants'
import { TOAST_CONFIG } from '../shared/utils'
import { useQueryInvalidation } from '../../useQueryInvalidation'

export const useOptimisticRemoveFromCart = () => {
  const queryClient = useQueryClient()
  const removeItems = useCartStore((s) => s.removeItems)
  const restoreItems = useCartStore((s) => s.restoreItems)
  const { invalidateCart } = useQueryInvalidation()

  return useMutation({
    mutationFn: purchaseApi.deletePurchase,
    onMutate: async (purchaseIds: string[]): Promise<RemoveFromCartContext> => {
      // Hủy các queries đang chờ
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.PURCHASES_IN_CART
      })

      const previousData = queryClient.getQueryData(QUERY_KEYS.PURCHASES_IN_CART)

      // Lưu thông tin sản phẩm bị xóa để có thể undo
      const removedItems =
        (previousData as PurchasesQueryData | undefined)?.data?.data?.filter((purchase: Purchase) =>
          purchaseIds.includes(purchase._id)
        ) || []

      // Cập nhật cache optimistically - xóa items ngay lập tức
      updatePurchasesCache(queryClient, QUERY_KEYS.PURCHASES_IN_CART, (old) => ({
        ...old,
        data: {
          ...old.data,
          data: old.data.data.filter((purchase: Purchase) => !purchaseIds.includes(purchase._id))
        }
      }))

      // Cập nhật context state optimistically
      removeItems(purchaseIds)

      // Hiển thị thông báo với option undo
      const undoToast = toast.success(TOAST_MESSAGES.REMOVE_FROM_CART_SUCCESS(purchaseIds.length), {
        ...TOAST_CONFIG.UNDO,
        closeButton: false,
        hideProgressBar: false,
        onClick: () => {
          // Undo functionality
          if (previousData) {
            queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, previousData)
            const restoredItems = removedItems.map((item: Purchase) =>
              createExtendedPurchase(item, { disabled: false, isChecked: false })
            )
            restoreItems(restoredItems)
            toast.dismiss(undoToast)
            showInfoToast(TOAST_MESSAGES.RESTORE_ITEMS)
          }
        }
      })

      return { previousData: previousData as PurchasesQueryData | undefined, removedItems, undoToast }
    },

    onError: (err, _purchaseIds, context) => {
      // Rollback khi có lỗi
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, context.previousData)

        // Khôi phục context state
        if (context.removedItems) {
          const restoredItems = context.removedItems.map((item: Purchase) =>
            createExtendedPurchase(item, { disabled: false, isChecked: false })
          )
          restoreItems(restoredItems)
        }
      }

      // Dismiss undo toast nếu có
      if (context?.undoToast) {
        toast.dismiss(context.undoToast)
      }

      // Hiển thị lỗi
      showErrorToast(TOAST_MESSAGES.REMOVE_FROM_CART_ERROR)
      logOptimisticError('Remove from cart', err, context)
    },

    onSuccess: (_data, purchaseIds, context) => {
      // Dismiss undo toast khi thành công
      if (context?.undoToast) {
        toast.dismiss(context.undoToast)
      }

      // Hiển thị thông báo thành công cuối cùng
      showSuccessToast(TOAST_MESSAGES.REMOVE_FROM_CART_FINAL_SUCCESS(purchaseIds.length))
    },

    onSettled: (_data, _error, variables) => {
      // Invalidate cart để sync với server
      invalidateCart()

      // Invalidate product details của các sản phẩm đã remove
      // để update stock quantity
      if (variables && Array.isArray(variables)) {
        // variables là array của purchase IDs, cần tìm product IDs
        // Điều này phức tạp hơn, có thể invalidate toàn bộ product lists thay vì
        queryClient.invalidateQueries({ queryKey: ['products', 'list'] })
      }
    }
  })
}
