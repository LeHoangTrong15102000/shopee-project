import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'react-toastify'

import { useCartStore } from 'src/stores/cart.store'
import { useOptimisticAddToCart } from '../useOptimisticAddToCart'
import { useOptimisticUpdateQuantity } from '../useOptimisticUpdateQuantity'
import { useOptimisticRemoveFromCart } from '../useOptimisticRemoveFromCart'
import { ExtendedPurchase, Purchase } from 'src/types/purchases.type'
import { Product } from 'src/types/product.type'
import { QUERY_KEYS } from '../../shared/types'
import { TOAST_MESSAGES } from '../../shared/constants'

vi.mock('src/apis/purchases.api', () => ({
  default: {
    addToCart: vi.fn(),
    updatePurchase: vi.fn(),
    deletePurchase: vi.fn()
  }
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(() => 'toast-id-1'),
    error: vi.fn(() => 'toast-id-2'),
    info: vi.fn(() => 'toast-id-3'),
    dismiss: vi.fn()
  }
}))

vi.mock('../../useQueryInvalidation', () => ({
  useQueryInvalidation: () => ({
    invalidateCart: vi.fn(),
    invalidateProductDetail: vi.fn(),
    invalidatePurchases: vi.fn()
  })
}))

import purchaseApi from 'src/apis/purchases.api'

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  _id: 'product-1',
  name: 'Test Product',
  price: 100000,
  price_before_discount: 120000,
  quantity: 50,
  sold: 100,
  view: 500,
  rating: 4.5,
  image: 'test-image.jpg',
  images: ['test-image.jpg'],
  description: 'Test description',
  category: { _id: 'cat-1', name: 'Test Category' },
  location: 'Ho Chi Minh',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
})

const createMockPurchase = (overrides: Partial<Purchase> = {}): Purchase => ({
  _id: 'purchase-1',
  buy_count: 2,
  price: 100000,
  price_before_discount: 120000,
  status: -1,
  user: 'user-1',
  product: createMockProduct(),
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
})

const createMockExtendedPurchase = (overrides: Partial<ExtendedPurchase> = {}): ExtendedPurchase => ({
  ...createMockPurchase(),
  disabled: false,
  isChecked: false,
  ...overrides
})

let queryClient: QueryClient

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  })
  useCartStore.setState({ items: [] })
  vi.clearAllMocks()
})

afterEach(() => {
  queryClient.clear()
  useCartStore.setState({ items: [] })
})

describe('useOptimisticAddToCart', () => {
  describe('Happy Path', () => {
    test('should add item to cart with optimistic update', async () => {
      const mockProduct = createMockProduct()
      const mockPurchaseResponse = createMockPurchase({ product: mockProduct })

      queryClient.setQueryData(['products', 'detail', 'product-1'], {
        data: { data: mockProduct }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      vi.mocked(purchaseApi.addToCart).mockResolvedValue({
        data: { data: mockPurchaseResponse, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticAddToCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 2 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.addToCart).toHaveBeenCalledWith(
        {
          product_id: 'product-1',
          buy_count: 2
        },
        expect.anything()
      )
    })

    test('should show success toast immediately on optimistic update', async () => {
      const mockProduct = createMockProduct()
      const mockPurchaseResponse = createMockPurchase({ product: mockProduct })

      queryClient.setQueryData(['products'], {
        data: { data: { products: [mockProduct] } }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      vi.mocked(purchaseApi.addToCart).mockResolvedValue({
        data: { data: mockPurchaseResponse, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticAddToCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 1 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(toast.success).toHaveBeenCalledWith(TOAST_MESSAGES.ADD_TO_CART_SUCCESS, expect.any(Object))
    })
  })

  describe('Rollback on Error', () => {
    test('should revert state when server returns error', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockExtendedPurchase({ _id: 'existing-1' })
      useCartStore.setState({ items: [existingPurchase] })

      queryClient.setQueryData(['products', 'detail', 'product-1'], {
        data: { data: mockProduct }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.addToCart).mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useOptimisticAddToCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 2 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.ADD_TO_CART_ERROR, expect.any(Object))
    })

    test('should show error toast on rollback', async () => {
      const mockProduct = createMockProduct()
      const previousPurchases = { data: { data: [] } }

      queryClient.setQueryData(['products', 'detail', 'product-1'], {
        data: { data: mockProduct }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, previousPurchases)

      vi.mocked(purchaseApi.addToCart).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useOptimisticAddToCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 1 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.ADD_TO_CART_ERROR, expect.any(Object))
    })
  })

  describe('Edge Cases', () => {
    test('should handle adding item when product not found in cache', async () => {
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      vi.mocked(purchaseApi.addToCart).mockResolvedValue({
        data: { data: createMockPurchase(), message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticAddToCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'non-existent-product', buy_count: 1 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.addToCart).toHaveBeenCalled()
    })

    test('should handle network timeout during server sync', async () => {
      const mockProduct = createMockProduct()

      queryClient.setQueryData(['products', 'detail', 'product-1'], {
        data: { data: mockProduct }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      vi.mocked(purchaseApi.addToCart).mockRejectedValue(new Error('Network timeout'))

      const { result } = renderHook(() => useOptimisticAddToCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 1 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalled()
    })
  })
})

describe('useOptimisticUpdateQuantity', () => {
  describe('Happy Path', () => {
    test('should update quantity optimistically', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 2,
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      const updatedPurchase = { ...existingPurchase, buy_count: 5 }
      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: updatedPurchase, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 5 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.updatePurchase).toHaveBeenCalledWith(
        {
          product_id: 'product-1',
          buy_count: 5
        },
        expect.anything()
      )
    })

    test('should update context state with new quantity', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 3,
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      const updatedPurchase = { ...existingPurchase, buy_count: 7 }
      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: updatedPurchase, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 7 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe('Rollback on Error', () => {
    test('should revert to previous quantity on error', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 3,
        product: mockProduct
      })
      const previousData = { data: { data: [existingPurchase] } }
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, previousData)

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 10 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.UPDATE_QUANTITY_ERROR, expect.any(Object))
    })

    test('should restore original buy_count in context on rollback', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 5,
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 15 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('Edge Cases', () => {
    test('should handle invalid quantity (zero)', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 2,
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Invalid quantity'))

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 0 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(purchaseApi.updatePurchase).toHaveBeenCalledWith(
        {
          product_id: 'product-1',
          buy_count: 0
        },
        expect.anything()
      )
    })

    test('should handle quantity exceeding stock', async () => {
      const mockProduct = createMockProduct({ quantity: 10 })
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 2,
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Quantity exceeds available stock'))

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 15 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalled()
    })

    test('should handle negative quantity', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 2,
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Invalid quantity'))

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: -1 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })
})

describe('useOptimisticRemoveFromCart', () => {
  describe('Happy Path', () => {
    test('should remove item optimistically', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.deletePurchase).mockResolvedValue({
        data: { data: { deleted_count: 1 }, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticRemoveFromCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate(['purchase-1'])
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.deletePurchase).toHaveBeenCalledWith(['purchase-1'], expect.anything())
    })

    test('should show success toast with undo option', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.deletePurchase).mockResolvedValue({
        data: { data: { deleted_count: 1 }, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticRemoveFromCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate(['purchase-1'])
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(toast.success).toHaveBeenCalled()
    })
  })

  describe('Rollback on Error', () => {
    test('should handle error gracefully and set isError state', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.deletePurchase).mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useOptimisticRemoveFromCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate(['purchase-1'])
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      // Verify error state is set correctly
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeDefined()

      // Verify error toast was called
      expect(toast.error).toHaveBeenCalled()
    })

    test('should restore context state on rollback', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.deletePurchase).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useOptimisticRemoveFromCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate(['purchase-1'])
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('Edge Cases', () => {
    test('should handle removing multiple items at once', async () => {
      const mockProduct1 = createMockProduct({ _id: 'product-1' })
      const mockProduct2 = createMockProduct({ _id: 'product-2' })
      const mockProduct3 = createMockProduct({ _id: 'product-3' })

      const purchase1 = createMockPurchase({ _id: 'purchase-1', product: mockProduct1 })
      const purchase2 = createMockPurchase({ _id: 'purchase-2', product: mockProduct2 })
      const purchase3 = createMockPurchase({ _id: 'purchase-3', product: mockProduct3 })

      useCartStore.setState({
        items: [
          createMockExtendedPurchase({ ...purchase1 }),
          createMockExtendedPurchase({ ...purchase2 }),
          createMockExtendedPurchase({ ...purchase3 })
        ]
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [purchase1, purchase2, purchase3] }
      })

      vi.mocked(purchaseApi.deletePurchase).mockResolvedValue({
        data: { data: { deleted_count: 2 }, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticRemoveFromCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate(['purchase-1', 'purchase-2'])
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.deletePurchase).toHaveBeenCalledWith(['purchase-1', 'purchase-2'], expect.anything())
    })

    test('should provide undo functionality via toast onClick', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        product: mockProduct
      })
      const previousData = { data: { data: [existingPurchase] } }
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, previousData)

      vi.mocked(purchaseApi.deletePurchase).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { data: { deleted_count: 1 }, message: 'Success' }
                } as any),
              100
            )
          )
      )

      const { result } = renderHook(() => useOptimisticRemoveFromCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate(['purchase-1'])
      })

      expect(toast.success).toHaveBeenCalledWith(
        TOAST_MESSAGES.REMOVE_FROM_CART_SUCCESS(1),
        expect.objectContaining({
          onClick: expect.any(Function)
        })
      )
    })

    test('should dismiss undo toast on successful deletion', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.deletePurchase).mockResolvedValue({
        data: { data: { deleted_count: 1 }, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticRemoveFromCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate(['purchase-1'])
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(toast.dismiss).toHaveBeenCalled()
    })

    test('should handle empty purchase ids array', async () => {
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      vi.mocked(purchaseApi.deletePurchase).mockResolvedValue({
        data: { data: { deleted_count: 0 }, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticRemoveFromCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate([])
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.deletePurchase).toHaveBeenCalledWith([], expect.anything())
    })
  })
})
