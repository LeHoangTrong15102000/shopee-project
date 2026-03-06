import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCartStore } from 'src/stores/cart.store'
import { useOptimisticRemoveFromCart } from '../useOptimisticRemoveFromCart'
import { ExtendedPurchase, Purchase } from 'src/types/purchases.type'
import { Product } from 'src/types/product.type'
import { QUERY_KEYS } from '../../shared/types'

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

describe('useOptimisticRemoveFromCart', () => {
  describe('Happy Path - Successful mutation with optimistic update', () => {
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
  })
})
