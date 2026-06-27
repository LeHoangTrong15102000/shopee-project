import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import CartItemList from '../CartItemList'
import { renderWithProviders } from 'src/utils/testUtils'
import type { ExtendedPurchase } from '../types'
import type { Purchase } from 'src/types/purchases.type'
import type { Product } from 'src/types/product.type'

// ---------------------------------------------------------------------------
// Mock heavy sub-components and hooks that are not relevant to variant labels
// ---------------------------------------------------------------------------

vi.mock('src/components/QuantityController', () => ({
  default: () => null,
}))

vi.mock('src/components/StockBadge', () => ({
  default: () => null,
}))

vi.mock('src/components/ShopeeCheckbox', () => ({
  default: ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <input type="checkbox" checked={checked} onChange={onChange} readOnly />
  ),
}))

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('src/components/RealTimeStockAlert', () => ({
  InlineStockAlert: () => null,
}))

vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => false, // Always render desktop layout for simplicity
}))

vi.mock('src/hooks/useSwipeGesture', () => ({
  useSwipeGesture: () => ({ dragProps: {} }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const createExtendedPurchase = (
  override: Partial<Purchase> & { disabled?: boolean; isChecked?: boolean } = {},
): ExtendedPurchase => ({
  _id: 'purchase-1',
  buy_count: 1,
  price: 100000,
  price_before_discount: 120000,
  status: -1,
  user: 'user-1',
  product: createMockProduct(),
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  disabled: false,
  isChecked: false,
  ...override,
})

/** Minimal prop set to render CartItemList without errors */
const buildProps = (extendedPurchases: ExtendedPurchase[], purchasesInCart: Purchase[] = []) => ({
  extendedPurchases,
  purchasesInCart,
  isAllChecked: false,
  inlineAlerts: new Map(),
  handleChecked: () => () => {},
  handleCheckedAll: () => {},
  handleQuantity: () => {},
  handleTypeQuantity: () => () => {},
  handleDelete: () => () => {},
  handleSaveForLater: () => () => {},
  handleDismissInlineAlert: () => {},
  path: { home: '/' },
  formatCurrency: (v: number) => v.toLocaleString(),
  generateNameId: ({ id }: { name: string; id: string }) => id,
})

// ---------------------------------------------------------------------------
// Tests — Task 8.4: CartItemList renders variant labels correctly
// ---------------------------------------------------------------------------

describe('CartItemList — variant label rendering (Task 8.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Desktop layout (useIsMobile = false)', () => {
    it('renders the variant label when sku.value is present', () => {
      const purchase = createExtendedPurchase({
        _id: 'p-red',
        product: createMockProduct({ _id: 'prod-1', name: 'Shirt' }),
        sku: { _id: 'sku-red', value: 'Red' },
      })

      renderWithProviders(<CartItemList {...buildProps([purchase], [purchase])} />)

      // The desktop layout is shown (lg: block); variant label should appear
      const label = screen.getAllByText('Red')
      expect(label.length).toBeGreaterThan(0)
    })

    it('renders the variant label using variant_values when sku.value is absent', () => {
      const purchase = createExtendedPurchase({
        _id: 'p-var',
        product: createMockProduct({ _id: 'prod-2', name: 'Pants' }),
        sku: {
          _id: 'sku-var',
          variant_values: { color: 'Blue', size: 'L' },
        },
      })

      renderWithProviders(<CartItemList {...buildProps([purchase], [purchase])} />)

      // variant_values joined with ', '
      const label = screen.getAllByText('Blue, L')
      expect(label.length).toBeGreaterThan(0)
    })

    it('renders no variant label when sku is absent (non-variant line)', () => {
      const VARIANT_LABEL_TEST_ID = 'variant-label-unique-marker'
      const purchase = createExtendedPurchase({
        _id: 'p-nv',
        product: createMockProduct({ _id: 'prod-3', name: 'Hat' }),
        // no sku field
      })

      const { container } = renderWithProviders(
        <CartItemList {...buildProps([purchase], [purchase])} />,
      )

      // The product name renders
      expect(screen.getAllByText('Hat').length).toBeGreaterThan(0)

      // No span with the variant pill classes should be present
      // The variant label span has bg-gray-100 and text-xs — no other element shares this exact
      // combination in the cart row (StockBadge is mocked to null, QuantityController is null)
      const variantSpans = container.querySelectorAll(
        'span.bg-gray-100.text-xs, span.rounded.bg-gray-100',
      )
      expect(variantSpans.length).toBe(0)

      void VARIANT_LABEL_TEST_ID // unused marker — keep for documentation
    })

    it('renders distinguishing labels for two variant lines of the same product', () => {
      const product = createMockProduct({ _id: 'prod-shirt', name: 'Classic Shirt' })
      const redLine = createExtendedPurchase({
        _id: 'p-red2',
        product,
        sku: { _id: 'sku-red2', value: 'Red / M' },
      })
      const blueL = createExtendedPurchase({
        _id: 'p-blue2',
        product,
        sku: { _id: 'sku-blue2', value: 'Blue / L' },
      })

      renderWithProviders(<CartItemList {...buildProps([redLine, blueL], [redLine, blueL])} />)

      expect(screen.getAllByText('Red / M').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Blue / L').length).toBeGreaterThan(0)
    })
  })
})
