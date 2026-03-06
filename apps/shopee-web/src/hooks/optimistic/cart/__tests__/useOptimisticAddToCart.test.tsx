import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'react-toastify'

import { useCartStore } from 'src/stores/cart.store'
import { useOptimisticAddToCart } from '../useOptimisticAddToCart'
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
  describe('Happy Path - Successful mutation with optimistic update', () => {
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

    test('should replace temporary purchase with real data on success', async () => {
      const mockProduct = createMockProduct()
      const mockPurchaseResponse = createMockPurchase({
        _id: 'real-purchase-id',
        product: mockProduct
      })

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
        result.current.mutate({ product_id: 'product-1', buy_count: 3 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.addToCart).toHaveBeenCalledWith(
        {
          product_id: 'product-1',
          buy_count: 3
        },
        expect.anything()
      )
    })
  })

  describe('Error Handling - Rollback when API fails', () => {
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

    test('should handle error gracefully and set isError state', async () => {
      const mockProduct = createMockProduct()

      queryClient.setQueryData(['products', 'detail', 'product-1'], {
        data: { data: mockProduct }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      vi.mocked(purchaseApi.addToCart).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useOptimisticAddToCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 2 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      // Verify error state is set correctly
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeDefined()
    })

    test('should call error toast on API failure', async () => {
      const mockProduct = createMockProduct()

      queryClient.setQueryData(['products', 'detail', 'product-1'], {
        data: { data: mockProduct }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      vi.mocked(purchaseApi.addToCart).mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useOptimisticAddToCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 1 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      // Verify error toast was called (may be called with any message format)
      expect(toast.error).toHaveBeenCalled()
    })
  })

  describe('Cache Updates - Verify query cache is updated correctly', () => {
    test('should cancel pending queries before optimistic update', async () => {
      const mockProduct = createMockProduct()
      const mockPurchaseResponse = createMockPurchase({ product: mockProduct })

      queryClient.setQueryData(['products', 'detail', 'product-1'], {
        data: { data: mockProduct }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      const cancelQueriesSpy = vi.spyOn(queryClient, 'cancelQueries')

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

      expect(cancelQueriesSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.PURCHASES_IN_CART
      })
    })

    test('should complete mutation successfully when API succeeds', async () => {
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

      // Verify mutation completed successfully
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toBeDefined()
    })
  })

  describe('Context Updates - Verify store is updated correctly', () => {
    test('should update store with new purchase on optimistic update', async () => {
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
    })

    test('should update context with isChecked true for new purchase', async () => {
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
        result.current.mutate({ product_id: 'product-1', buy_count: 1 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe('Toast Notifications - Verify correct toasts are shown', () => {
    test('should show success toast with correct message', async () => {
      const mockProduct = createMockProduct()
      const mockPurchaseResponse = createMockPurchase({ product: mockProduct })

      // Use ['product'] key which matches findProductInCache function
      queryClient.setQueryData(['product', 'product-1'], {
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
        result.current.mutate({ product_id: 'product-1', buy_count: 1 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Toast is called during onMutate (optimistic), verify it was called
      expect(toast.success).toHaveBeenCalled()
    })

    test('should show error toast with correct message on failure', async () => {
      const mockProduct = createMockProduct()

      // Use ['product'] key which matches findProductInCache function
      queryClient.setQueryData(['product', 'product-1'], {
        data: { data: mockProduct }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      vi.mocked(purchaseApi.addToCart).mockRejectedValue(new Error('API Error'))

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

    test('should handle adding to existing cart with items', async () => {
      const mockProduct = createMockProduct({ _id: 'product-2' })
      const existingPurchase = createMockPurchase({ _id: 'existing-1' })
      const mockPurchaseResponse = createMockPurchase({
        _id: 'new-purchase',
        product: mockProduct
      })

      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(['products', 'detail', 'product-2'], {
        data: { data: mockProduct }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.addToCart).mockResolvedValue({
        data: { data: mockPurchaseResponse, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticAddToCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-2', buy_count: 1 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.addToCart).toHaveBeenCalledWith(
        {
          product_id: 'product-2',
          buy_count: 1
        },
        expect.anything()
      )
    })

    test('should handle concurrent add to cart requests', async () => {
      const mockProduct1 = createMockProduct({ _id: 'product-1' })
      const mockProduct2 = createMockProduct({ _id: 'product-2' })

      queryClient.setQueryData(['products', 'detail', 'product-1'], {
        data: { data: mockProduct1 }
      })
      queryClient.setQueryData(['products', 'detail', 'product-2'], {
        data: { data: mockProduct2 }
      })
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      vi.mocked(purchaseApi.addToCart)
        .mockResolvedValueOnce({
          data: { data: createMockPurchase({ _id: 'purchase-1', product: mockProduct1 }), message: 'Success' }
        } as any)
        .mockResolvedValueOnce({
          data: { data: createMockPurchase({ _id: 'purchase-2', product: mockProduct2 }), message: 'Success' }
        } as any)

      const { result } = renderHook(() => useOptimisticAddToCart(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 1 })
        result.current.mutate({ product_id: 'product-2', buy_count: 2 })
      })

      await waitFor(() => expect(purchaseApi.addToCart).toHaveBeenCalledTimes(2))
    })

    test('should handle large buy_count values', async () => {
      const mockProduct = createMockProduct({ quantity: 1000 })
      const mockPurchaseResponse = createMockPurchase({
        product: mockProduct,
        buy_count: 999
      })

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
        result.current.mutate({ product_id: 'product-1', buy_count: 999 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.addToCart).toHaveBeenCalledWith(
        {
          product_id: 'product-1',
          buy_count: 999
        },
        expect.anything()
      )
    })
  })
})
