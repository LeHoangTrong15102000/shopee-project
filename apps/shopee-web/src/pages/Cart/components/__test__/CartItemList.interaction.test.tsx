/**
 * CartItemList interaction tests — Task 2
 *
 * Renders CartItemList with the REAL useOptimisticSwitchVariant hook.
 * Uses the __test__ (no-s) folder because this folder does NOT mock
 * ProductVariantSelector (unlike __tests__/CartItemList.test.tsx which does).
 *
 * Mocked:
 *   - purchaseApi.updatePurchase  (assert call payload)
 *   - productApi.getProductDetail (feeds VariantSelectorPanel's useQuery)
 *
 * NOT mocked: useOptimisticSwitchVariant, ProductVariantSelector
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'

import CartItemList from '../CartItemList'
import type { ExtendedPurchase } from 'src/pages/Cart/types'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before imports that depend on them
// ---------------------------------------------------------------------------

vi.mock('src/apis/purchases.api', () => ({
  default: {
    updatePurchase: vi.fn(),
  },
}))

vi.mock('src/apis/product.api', () => ({
  default: {
    getProductDetail: vi.fn(),
  },
}))

// Stub heavy components that are not under test here
vi.mock('src/components/QuantityController', () => ({
  default: ({ value }: { value: number }) => <div data-testid="qty-ctrl">{value}</div>,
}))

vi.mock('src/components/StockBadge', () => ({
  default: () => null,
}))

vi.mock('src/components/ShopeeCheckbox', () => ({
  default: ({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) => (
    <input type="checkbox" checked={checked} onChange={() => onChange(!checked)} readOnly />
  ),
}))

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

vi.mock('src/components/RealTimeStockAlert', () => ({
  InlineStockAlert: () => null,
}))

vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/hooks/useSwipeGesture', () => ({
  useSwipeGesture: () => ({ dragProps: {} }),
}))

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}))

// i18next minimal stub — t(key, fallback) → fallback
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

// framer-motion: render children without animation so tests are synchronous
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    ),
    a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a {...props}>{children}</a>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}))

// ---------------------------------------------------------------------------
// Deferred import of mocked modules (after vi.mock declarations)
// ---------------------------------------------------------------------------
import purchaseApi from 'src/apis/purchases.api'
import productApi from 'src/apis/product.api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: Infinity },
      mutations: { retry: false },
    },
  })

const renderCart = (purchase: ExtendedPurchase, queryClient: QueryClient) => {
  const props = {
    extendedPurchases: [purchase],
    purchasesInCart: [purchase],
    isAllChecked: false,
    inlineAlerts: new Map<
      string,
      { productId: string; productName: string; newStock: number; severity: 'warning' | 'critical' }
    >(),
    handleChecked: () => () => {},
    handleCheckedAll: () => {},
    handleQuantity: () => {},
    handleTypeQuantity: () => () => {},
    handleDelete: () => () => {},
    handleSaveForLater: () => () => {},
    handleDismissInlineAlert: () => {},
    path: { home: '/' },
    formatCurrency: (v: number) => v.toLocaleString(),
    generateNameId: ({ name, id }: { name: string; id: string }) => `${name}-${id}`,
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CartItemList {...props} />
      </BrowserRouter>
    </QueryClientProvider>,
  )
}

// A purchase line with SKU "sku-A" (current variant)
const makePurchaseWithSku = (): ExtendedPurchase => ({
  _id: 'purchase-1',
  buy_count: 2,
  price: 100000,
  price_before_discount: 120000,
  status: -1,
  user: 'user-1',
  disabled: false,
  isChecked: false,
  product: {
    _id: 'product-1',
    name: 'Test Shirt',
    image: 'shirt.jpg',
    images: ['shirt.jpg'],
    price: 100000,
    price_before_discount: 120000,
    quantity: 50,
    sold: 10,
    view: 100,
    rating: 4.5,
    description: 'A test shirt',
    category: { _id: 'cat-1', name: 'Clothing' },
    location: 'HCM',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  sku: {
    _id: 'sku-A',
    value: 'Red',
    variant_values: { color: 'Red' },
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
})

// The product detail returned by the mocked getProductDetail.
// It has two SKUs: sku-A (Red, current) and sku-B (Blue, target).
const makeMockedProductDetail = () => ({
  data: {
    data: {
      _id: 'product-1',
      name: 'Test Shirt',
      image: 'shirt.jpg',
      images: ['shirt.jpg'],
      price: 100000,
      price_before_discount: 120000,
      quantity: 50,
      sold: 10,
      view: 100,
      rating: 4.5,
      description: 'A test shirt',
      category: { _id: 'cat-1', name: 'Clothing' },
      location: 'HCM',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      variants: [
        {
          _id: 'variant-color',
          type: 'color',
          name: 'Color',
          options: [
            { name: 'Red', value: 'Red' },
            { name: 'Blue', value: 'Blue' },
          ],
        },
      ],
      skus: [
        { _id: 'sku-A', value: 'Red', price: 100000, stock: 10, variant_values: { color: 'Red' } },
        { _id: 'sku-B', value: 'Blue', price: 150000, stock: 8, variant_values: { color: 'Blue' } },
      ],
    },
  },
})

// ---------------------------------------------------------------------------
// Tests — Task 2: Cart UI interaction
// ---------------------------------------------------------------------------

describe('CartItemList — variant switch interaction (Task 2)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
    vi.clearAllMocks()

    // Seed the purchase cache so useOptimisticSwitchVariant can read it
    queryClient.setQueryData(['purchases', { status: -1 }], {
      data: { data: [makePurchaseWithSku()] },
    })

    // Mock productApi.getProductDetail to return the two-SKU product
    vi.mocked(productApi.getProductDetail).mockResolvedValue(
      makeMockedProductDetail() as ReturnType<typeof productApi.getProductDetail>,
    )
  })

  // Task 2.2 — selecting a DIFFERENT SKU fires the switch mutation with correct payload
  it('fires switchVariant mutation with correct payload when a different SKU is selected', async () => {
    const user = userEvent.setup()

    vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
      data: { data: makePurchaseWithSku(), message: 'ok' },
    } as ReturnType<typeof purchaseApi.updatePurchase>)

    const purchase = makePurchaseWithSku()
    renderCart(purchase, queryClient)

    // Click the variant badge to open the selector panel (first match — desktop view)
    const changeBtns = screen.getAllByLabelText('Change variant')
    await user.click(changeBtns[0])

    // Wait for the selector panel to appear and load (productApi resolves)
    await waitFor(() => {
      expect(productApi.getProductDetail).toHaveBeenCalledWith('product-1')
    })

    // Wait for the "Blue" option button to appear (after product detail loads)
    const blueBtn = await screen.findByRole('radio', { name: /Blue/i })
    await user.click(blueBtn)

    await waitFor(() => {
      expect(purchaseApi.updatePurchase).toHaveBeenCalledOnce()
    })

    const callArg = vi.mocked(purchaseApi.updatePurchase).mock.calls[0][0]
    expect(callArg.product_id).toBe('product-1')
    expect(callArg.sku_id).toBe('sku-A')
    expect(callArg.target_sku_id).toBe('sku-B')
  })

  // Task 2.3 — selecting the SAME SKU fires NO mutation (no-op guard)
  it('does NOT fire mutation when the already-selected SKU is re-selected', async () => {
    const user = userEvent.setup()

    vi.mocked(purchaseApi.updatePurchase).mockResolvedValue({
      data: { data: makePurchaseWithSku(), message: 'ok' },
    } as ReturnType<typeof purchaseApi.updatePurchase>)

    const purchase = makePurchaseWithSku()
    renderCart(purchase, queryClient)

    // Open the selector (first match — desktop view; dual layout renders two buttons)
    const changeBtns = screen.getAllByLabelText('Change variant')
    await user.click(changeBtns[0])

    await waitFor(() => {
      expect(productApi.getProductDetail).toHaveBeenCalledWith('product-1')
    })

    // Wait for "Red" (the current SKU) button to appear
    const redBtn = await screen.findByRole('radio', { name: /^Red/i })
    await act(async () => {
      await user.click(redBtn)
    })

    // No mutation should have been called — same SKU as current line
    expect(purchaseApi.updatePurchase).not.toHaveBeenCalled()
  })
})
