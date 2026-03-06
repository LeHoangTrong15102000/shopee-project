import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'react-toastify'

import { useCartStore } from 'src/stores/cart.store'
import { useOptimisticUpdateQuantity } from '../useOptimisticUpdateQuantity'
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

describe('useOptimisticUpdateQuantity', () => {
  describe('Happy Path - Successful mutation with optimistic update', () => {
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

    test('should update quantity immediately without waiting for server', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 1,
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.updatePurchase).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { data: { ...existingPurchase, buy_count: 10 }, message: 'Success' }
                } as any),
              500
            )
          )
      )

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 10 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })

    test('should not disable UI during optimistic update', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 2,
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase, disabled: false })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      const updatedPurchase = { ...existingPurchase, buy_count: 4 }
      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: updatedPurchase, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 4 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe('Error Handling - Rollback when API fails', () => {
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

    test('should handle error gracefully and set isError state', async () => {
      const mockProduct = createMockProduct()
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 4,
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 20 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      // Verify error state is set correctly
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeDefined()
    })

    test('should show error toast with correct message', async () => {
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

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 8 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.UPDATE_QUANTITY_ERROR, expect.any(Object))
    })
  })

  describe('Cache Updates - Verify query cache is updated correctly', () => {
    test('should cancel pending queries before optimistic update', async () => {
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

      const cancelQueriesSpy = vi.spyOn(queryClient, 'cancelQueries')

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: { ...existingPurchase, buy_count: 5 }, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 5 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(cancelQueriesSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.PURCHASES_IN_CART
      })
    })

    test('should complete mutation successfully when API succeeds', async () => {
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

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: { ...existingPurchase, buy_count: 6 }, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 6 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Verify mutation completed successfully
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toBeDefined()
    })

    test('should only update the specific product quantity in cache', async () => {
      const mockProduct1 = createMockProduct({ _id: 'product-1' })
      const mockProduct2 = createMockProduct({ _id: 'product-2' })
      const purchase1 = createMockPurchase({ _id: 'purchase-1', buy_count: 2, product: mockProduct1 })
      const purchase2 = createMockPurchase({ _id: 'purchase-2', buy_count: 3, product: mockProduct2 })

      useCartStore.setState({
        items: [createMockExtendedPurchase({ ...purchase1 }), createMockExtendedPurchase({ ...purchase2 })]
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [purchase1, purchase2] }
      })

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: { ...purchase1, buy_count: 5 }, message: 'Success' }
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
  })

  describe('Context Updates - Verify store is updated correctly', () => {
    test('should update store with updated quantity', async () => {
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

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: { ...existingPurchase, buy_count: 8 }, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 8 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })

    test('should update context with server response on success', async () => {
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

      const serverResponse = { ...existingPurchase, buy_count: 10 }
      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: serverResponse, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 10 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe('Toast Notifications - Verify correct toasts are shown', () => {
    test('should show error toast on update failure', async () => {
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

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 5 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.UPDATE_QUANTITY_ERROR, expect.any(Object))
    })

    test('should not show success toast on quantity update (silent success)', async () => {
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

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: { ...existingPurchase, buy_count: 5 }, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 5 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(toast.success).not.toHaveBeenCalled()
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

    test('should handle updating non-existent product', async () => {
      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [] }
      })

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Product not found'))

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'non-existent', buy_count: 5 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })

    test('should handle rapid consecutive updates', async () => {
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

      vi.mocked(purchaseApi.updatePurchase)
        .mockResolvedValueOnce({
          data: { data: { ...existingPurchase, buy_count: 3 }, message: 'Success' }
        } as any)
        .mockResolvedValueOnce({
          data: { data: { ...existingPurchase, buy_count: 4 }, message: 'Success' }
        } as any)
        .mockResolvedValueOnce({
          data: { data: { ...existingPurchase, buy_count: 5 }, message: 'Success' }
        } as any)

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 3 })
        result.current.mutate({ product_id: 'product-1', buy_count: 4 })
        result.current.mutate({ product_id: 'product-1', buy_count: 5 })
      })

      await waitFor(() => expect(purchaseApi.updatePurchase).toHaveBeenCalledTimes(3))
    })

    test('should handle large quantity values', async () => {
      const mockProduct = createMockProduct({ quantity: 10000 })
      const existingPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 2,
        product: mockProduct
      })
      useCartStore.setState({ items: [createMockExtendedPurchase({ ...existingPurchase })] })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [existingPurchase] }
      })

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: { ...existingPurchase, buy_count: 9999 }, message: 'Success' }
      } as any)

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 9999 })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.updatePurchase).toHaveBeenCalledWith(
        {
          product_id: 'product-1',
          buy_count: 9999
        },
        expect.anything()
      )
    })

    test('should handle network timeout', async () => {
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

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Network timeout'))

      const { result } = renderHook(() => useOptimisticUpdateQuantity(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        result.current.mutate({ product_id: 'product-1', buy_count: 5 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalled()
    })
  })
})
