import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'react-toastify'

import { useOptimisticSwitchVariant } from '../useOptimisticSwitchVariant'
import { Purchase } from 'src/types/purchases.type'
import { Product } from 'src/types/product.type'
import { QUERY_KEYS } from '../../shared/types'

vi.mock('src/apis/purchases.api', () => ({
  default: {
    updatePurchase: vi.fn(),
  },
}))

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(() => 'toast-id-1'),
    success: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock('../../useQueryInvalidation', () => ({
  useQueryInvalidation: () => ({
    invalidateCart: vi.fn(),
    invalidateProductDetail: vi.fn(),
    invalidatePurchases: vi.fn(),
  }),
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
  ...overrides,
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
  ...overrides,
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
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
  vi.clearAllMocks()
})

afterEach(() => {
  queryClient.clear()
})

describe('useOptimisticSwitchVariant', () => {
  describe('Plain switch — no existing target line', () => {
    test('should rewrite source line sku in cache optimistically', async () => {
      const sourcePurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 2,
        price: 100000,
        price_before_discount: 120000,
        sku: { _id: 'sku-A', value: 'Red', variant_values: { color: 'Red' } },
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [sourcePurchase] },
      })

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: sourcePurchase, message: 'Success' },
      } as ReturnType<typeof purchaseApi.updatePurchase>)

      const { result } = renderHook(() => useOptimisticSwitchVariant(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          product_id: 'product-1',
          sku_id: 'sku-A',
          target_sku_id: 'sku-B',
          buy_count: 2,
          target_price: 150000,
          target_price_before_discount: 180000,
        })
      })

      // Optimistic update: the cache should contain the rewritten sku and updated price before server responds
      const cached = queryClient.getQueryData<{ data: { data: Purchase[] } }>(
        QUERY_KEYS.PURCHASES_IN_CART,
      )
      const line = cached?.data?.data?.[0]
      expect(line?.sku?._id).toBe('sku-B')
      expect(line?.buy_count).toBe(2)
      expect(line?.price).toBe(150000)
      expect(line?.price_before_discount).toBe(180000)
    })

    test('should leave price unchanged when target_price is not provided', async () => {
      const sourcePurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 2,
        price: 100000,
        price_before_discount: 120000,
        sku: { _id: 'sku-A', value: 'Red', variant_values: { color: 'Red' } },
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [sourcePurchase] },
      })

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: sourcePurchase, message: 'Success' },
      } as ReturnType<typeof purchaseApi.updatePurchase>)

      const { result } = renderHook(() => useOptimisticSwitchVariant(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          product_id: 'product-1',
          sku_id: 'sku-A',
          target_sku_id: 'sku-B',
          buy_count: 2,
          // no target_price — price stays at source value until server sync
        })
      })

      const cached = queryClient.getQueryData<{ data: { data: Purchase[] } }>(
        QUERY_KEYS.PURCHASES_IN_CART,
      )
      const line = cached?.data?.data?.[0]
      expect(line?.sku?._id).toBe('sku-B')
      expect(line?.price).toBe(100000) // unchanged from source
    })

    test('should call purchaseApi.updatePurchase with target_sku_id', async () => {
      const sourcePurchase = createMockPurchase({
        sku: { _id: 'sku-A', value: 'Red', variant_values: { color: 'Red' } },
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [sourcePurchase] },
      })

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: sourcePurchase, message: 'Success' },
      } as ReturnType<typeof purchaseApi.updatePurchase>)

      const { result } = renderHook(() => useOptimisticSwitchVariant(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          product_id: 'product-1',
          sku_id: 'sku-A',
          target_sku_id: 'sku-B',
          buy_count: 3,
        })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(purchaseApi.updatePurchase).toHaveBeenCalledWith({
        product_id: 'product-1',
        buy_count: 3,
        sku_id: 'sku-A',
        target_sku_id: 'sku-B',
      })
    })
  })

  describe('Merge path — target SKU already has a line', () => {
    test('should sum buy_counts into target line and remove source line', async () => {
      const sourcePurchase = createMockPurchase({
        _id: 'purchase-src',
        buy_count: 2,
        sku: { _id: 'sku-A', value: 'Red', variant_values: { color: 'Red' } },
      })
      const targetPurchase = createMockPurchase({
        _id: 'purchase-tgt',
        buy_count: 3,
        sku: { _id: 'sku-B', value: 'Blue', variant_values: { color: 'Blue' } },
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [sourcePurchase, targetPurchase] },
      })

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: targetPurchase, message: 'Success' },
      } as ReturnType<typeof purchaseApi.updatePurchase>)

      const { result } = renderHook(() => useOptimisticSwitchVariant(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          product_id: 'product-1',
          sku_id: 'sku-A',
          target_sku_id: 'sku-B',
          buy_count: 2,
        })
      })

      // Optimistic update: source line removed, target line has merged buy_count
      const cached = queryClient.getQueryData<{ data: { data: Purchase[] } }>(
        QUERY_KEYS.PURCHASES_IN_CART,
      )
      const lines = cached?.data?.data ?? []
      expect(lines).toHaveLength(1)
      expect(lines[0].sku?._id).toBe('sku-B')
      expect(lines[0].buy_count).toBe(5) // 2 + 3
    })

    test('should use payload buy_count when provided for merge', async () => {
      const sourcePurchase = createMockPurchase({
        _id: 'purchase-src',
        buy_count: 5,
        sku: { _id: 'sku-A', value: 'Red', variant_values: { color: 'Red' } },
      })
      const targetPurchase = createMockPurchase({
        _id: 'purchase-tgt',
        buy_count: 1,
        sku: { _id: 'sku-B', value: 'Blue', variant_values: { color: 'Blue' } },
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [sourcePurchase, targetPurchase] },
      })

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: targetPurchase, message: 'Success' },
      } as ReturnType<typeof purchaseApi.updatePurchase>)

      const { result } = renderHook(() => useOptimisticSwitchVariant(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          product_id: 'product-1',
          sku_id: 'sku-A',
          target_sku_id: 'sku-B',
          buy_count: 3, // explicit buy_count in payload, not source's 5
        })
      })

      // Optimistic update: source removed, target has buy_count = payload(3) + target(1) = 4
      const cached = queryClient.getQueryData<{ data: { data: Purchase[] } }>(
        QUERY_KEYS.PURCHASES_IN_CART,
      )
      const lines = cached?.data?.data ?? []
      expect(lines).toHaveLength(1)
      expect(lines[0].sku?._id).toBe('sku-B')
      expect(lines[0].buy_count).toBe(4) // 3 (payload) + 1 (target)
    })
  })

  describe('Rollback on failure', () => {
    test('should restore previous cache data on API error', async () => {
      const originalPurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 2,
        sku: { _id: 'sku-A', value: 'Red', variant_values: { color: 'Red' } },
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [originalPurchase] },
      })

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useOptimisticSwitchVariant(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          product_id: 'product-1',
          sku_id: 'sku-A',
          target_sku_id: 'sku-B',
          buy_count: 2,
        })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      // After failure the cache should be restored to original state
      const cached = queryClient.getQueryData<{ data: { data: Purchase[] } }>(
        QUERY_KEYS.PURCHASES_IN_CART,
      )
      const lines = cached?.data?.data ?? []
      expect(lines).toHaveLength(1)
      expect(lines[0].sku?._id).toBe('sku-A')
      expect(lines[0].buy_count).toBe(2)
    })

    test('should show error toast on API failure', async () => {
      const sourcePurchase = createMockPurchase({
        sku: { _id: 'sku-A', value: 'Red', variant_values: { color: 'Red' } },
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [sourcePurchase] },
      })

      vi.mocked(purchaseApi.updatePurchase).mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useOptimisticSwitchVariant(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          product_id: 'product-1',
          sku_id: 'sku-A',
          target_sku_id: 'sku-B',
        })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    test('should leave cache unchanged when source line is not found', async () => {
      const unrelatedPurchase = createMockPurchase({
        _id: 'purchase-other',
        sku: { _id: 'sku-X', value: 'Other', variant_values: { color: 'Other' } },
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [unrelatedPurchase] },
      })

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: unrelatedPurchase, message: 'Success' },
      } as ReturnType<typeof purchaseApi.updatePurchase>)

      const { result } = renderHook(() => useOptimisticSwitchVariant(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          product_id: 'product-1',
          sku_id: 'sku-MISSING',
          target_sku_id: 'sku-B',
        })
      })

      // Cache should remain unmodified when source line is not found
      const cached = queryClient.getQueryData<{ data: { data: Purchase[] } }>(
        QUERY_KEYS.PURCHASES_IN_CART,
      )
      const lines = cached?.data?.data ?? []
      expect(lines).toHaveLength(1)
      expect(lines[0].sku?._id).toBe('sku-X')
    })

    test('should work when buy_count is omitted (uses source line buy_count)', async () => {
      const sourcePurchase = createMockPurchase({
        _id: 'purchase-1',
        buy_count: 4,
        sku: { _id: 'sku-A', value: 'Red', variant_values: { color: 'Red' } },
      })

      queryClient.setQueryData(QUERY_KEYS.PURCHASES_IN_CART, {
        data: { data: [sourcePurchase] },
      })

      vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
        data: { data: sourcePurchase, message: 'Success' },
      } as ReturnType<typeof purchaseApi.updatePurchase>)

      const { result } = renderHook(() => useOptimisticSwitchVariant(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          product_id: 'product-1',
          sku_id: 'sku-A',
          target_sku_id: 'sku-B',
          // no buy_count — should default to source line's buy_count
        })
      })

      const cached = queryClient.getQueryData<{ data: { data: Purchase[] } }>(
        QUERY_KEYS.PURCHASES_IN_CART,
      )
      const line = cached?.data?.data?.[0]
      expect(line?.sku?._id).toBe('sku-B')
      expect(line?.buy_count).toBe(4) // preserved from source
    })
  })
})
