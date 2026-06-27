import { useMutation, useQueryClient } from '@tanstack/react-query'

import purchaseApi from 'src/apis/purchases.api'
import { purchasesStatus } from 'src/constant/purchase'
import { useCartStore } from 'src/stores/cart.store'
import { Purchase } from 'src/types/purchases.type'
import { useQueryInvalidation } from '../../useQueryInvalidation'
import { TOAST_MESSAGES } from '../shared/constants'
import { AddToCartContext, AddToCartPayload, PurchasesQueryData, QUERY_KEYS } from '../shared/types'
import { cartLineMatches } from '../shared/cartLineEquality'
import {
  createExtendedPurchase,
  createOptimisticPurchase,
  findProductInCache,
  logOptimisticError,
  showErrorToast,
  showSuccessToast,
  updatePurchasesCache,
} from '../shared/utils'

export const useOptimisticAddToCart = () => {
  const queryClient = useQueryClient()
  const addOptimisticItem = useCartStore((s) => s.addOptimisticItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const replaceTempItems = useCartStore((s) => s.replaceTempItems)
  const removeTempItems = useCartStore((s) => s.removeTempItems)
  const { invalidateCart, invalidateProductDetail } = useQueryInvalidation()

  return useMutation({
    mutationFn: purchaseApi.addToCart,
    onMutate: async (newItem: AddToCartPayload): Promise<AddToCartContext> => {
      // Hủy các queries đang chờ để tránh override optimistic update
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.PURCHASES_IN_CART,
      })

      // Snapshot data hiện tại để rollback khi cần
      const previousPurchases = queryClient.getQueryData(QUERY_KEYS.PURCHASES_IN_CART)

      // Tìm thông tin sản phẩm từ cache
      const productData = findProductInCache(queryClient, newItem.product_id)

      if (productData) {
        // Kiểm tra sản phẩm đã tồn tại trong cart chưa (match backend logic)
        const existingInCache = (
          previousPurchases as PurchasesQueryData | undefined
        )?.data?.data?.find(
          (item: Purchase) =>
            cartLineMatches(item, newItem.product_id, newItem.sku_id) &&
            item.status === purchasesStatus.inCart,
        )

        if (existingInCache) {
          // Sản phẩm đã có trong cart → cộng dồn quantity (giống backend)
          const newQuantity = existingInCache.buy_count + newItem.buy_count

          updatePurchasesCache(queryClient, QUERY_KEYS.PURCHASES_IN_CART, (old) => ({
            ...old,
            data: {
              ...old.data,
              data:
                old.data?.data?.map((item: Purchase) =>
                  item._id === existingInCache._id ? { ...item, buy_count: newQuantity } : item,
                ) || [],
            },
          }))

          // Cập nhật store quantity
          updateQuantity(newItem.product_id, newQuantity)
        } else {
          // Sản phẩm chưa có → tạo optimistic item mới
          const optimisticPurchase = createOptimisticPurchase(
            productData,
            newItem.buy_count,
            purchasesStatus.inCart,
          )

          updatePurchasesCache(queryClient, QUERY_KEYS.PURCHASES_IN_CART, (old) => ({
            ...old,
            data: {
              ...old.data,
              data: [...(old.data?.data || []), optimisticPurchase],
            },
          }))

          addOptimisticItem(
            createExtendedPurchase(optimisticPurchase, {
              disabled: false,
              isChecked: true,
            }),
          )
        }

        // Hiển thị feedback ngay lập tức
        showSuccessToast(TOAST_MESSAGES.ADD_TO_CART_SUCCESS)
      }

      return {
        previousPurchases: previousPurchases as PurchasesQueryData | undefined,
        optimisticPurchase: productData
          ? createOptimisticPurchase(productData, newItem.buy_count, purchasesStatus.inCart)
          : undefined,
      }
    },

    onError: (err, _newItem, context) => {
      // Rollback khi có lỗi
      if (context?.previousPurchases) {
        queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, context.previousPurchases)
      }

      // Rollback context state
      if (context?.optimisticPurchase) {
        removeTempItems()
      }

      // Hiển thị lỗi
      showErrorToast(TOAST_MESSAGES.ADD_TO_CART_ERROR)
      logOptimisticError('Add to cart', err, context)
    },

    onSuccess: (data, variables, _context) => {
      // Thay thế item tạm thời hoặc cập nhật item đã tồn tại bằng data thật từ server
      const realPurchase = data.data.data

      updatePurchasesCache(queryClient, QUERY_KEYS.PURCHASES_IN_CART, (old) => ({
        ...old,
        data: {
          ...old.data,
          data: old.data?.data?.map((item: Purchase) => {
            // Replace temp items (sản phẩm mới)
            if (item._id.startsWith('temp-')) return realPurchase
            // Update existing items (sản phẩm đã có trong cart, server trả về cùng _id)
            if (item._id === realPurchase._id) return realPurchase
            // Cũng match theo product_id + sku_id cho trường hợp optimistic update đã cập nhật quantity
            if (
              cartLineMatches(item, variables.product_id, variables.sku_id) &&
              item.status === purchasesStatus.inCart
            ) {
              return realPurchase
            }
            return item
          }) || [realPurchase],
        },
      }))

      // Cập nhật context với data thật
      replaceTempItems(realPurchase)
      // Sync quantity cho existing items
      updateQuantity(variables.product_id, realPurchase.buy_count)
    },

    onSettled: (_data, _error, variables) => {
      // Invalidate cart để đảm bảo sync với server
      invalidateCart()

      // Invalidate product detail để update stock quantity nếu cần
      if (variables.product_id) {
        invalidateProductDetail(variables.product_id)
      }
    },
  })
}
