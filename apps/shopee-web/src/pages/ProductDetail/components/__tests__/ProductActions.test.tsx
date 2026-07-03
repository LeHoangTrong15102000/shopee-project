import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductActions from '../ProductActions'
import { renderWithProviders } from 'src/utils/testUtils'
import { useCartStore } from 'src/stores/cart.store'
import { ExtendedPurchase } from 'src/types/purchases.type'
import { Product as ProductType, ProductSKU } from 'src/types/product.type'

// Mock optimistic add to cart
const mockMutate = vi.fn()
const mockMutateAsync = vi.fn()
vi.mock('src/hooks/optimistic', () => ({
  useOptimisticAddToCart: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const createMockCartItem = (productId: string, buyCount: number): ExtendedPurchase => ({
  _id: `purchase-${productId}`,
  buy_count: buyCount,
  price: 100000,
  price_before_discount: 120000,
  status: -1,
  user: 'user-1',
  product: {
    _id: productId,
    name: 'Test Product',
    price: 100000,
    price_before_discount: 120000,
    quantity: 50,
    sold: 10,
    view: 100,
    rating: 4.5,
    category: { _id: 'cat-1', name: 'Category' },
    image: 'https://example.com/image.jpg',
    images: ['https://example.com/image.jpg'],
    description: 'Test',
    location: 'Hồ Chí Minh',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  disabled: false,
  isChecked: false,
})

const mockProduct: ProductType = {
  _id: 'product-1',
  name: 'Test Product',
  price: 100000,
  price_before_discount: 120000,
  quantity: 10,
  sold: 5,
  view: 100,
  rating: 4.5,
  category: { _id: 'cat-1', name: 'Category' },
  image: 'https://example.com/image.jpg',
  images: ['https://example.com/image.jpg'],
  description: 'Test product',
  location: 'Hồ Chí Minh',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

describe('ProductActions - Cart Validation (Task 1.9)', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    useCartStore.getState().setItems([])
    mockMutateAsync.mockResolvedValue({ data: { data: { _id: 'purchase-1' } } })
  })

  it('allows adding to cart when cart is empty', async () => {
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).toHaveBeenCalledWith({ product_id: 'product-1', buy_count: 1 })
  })

  it('allows adding when partial cart (existing + new <= stock)', async () => {
    useCartStore.getState().setItems([createMockCartItem('product-1', 5)])
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).toHaveBeenCalled()
  })

  it('shows error toast when cart is at stock limit', async () => {
    const { toast } = await import('react-toastify')
    useCartStore.getState().setItems([createMockCartItem('product-1', 10)])
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Bạn đã có 10 sản phẩm trong giỏ'),
      expect.objectContaining({ autoClose: 3000, position: 'top-center' }),
    )
  })

  it('shows available quantity text', () => {
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    expect(screen.getByText(/10\s+Sản phẩm có sẵn/)).toBeInTheDocument()
  })

  it('QuantityController max adjusts based on existing cart quantity', () => {
    useCartStore.getState().setItems([createMockCartItem('product-1', 7)])
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    // Max should be 3 (10 - 7), verify via aria-valuemax on the spinbutton input
    const quantityInput = screen.getByRole('spinbutton', { name: 'Quantity' })
    expect(quantityInput).toHaveAttribute('aria-valuemax', '3')
  })

  it('allows adding at exact stock limit (existing + new = stock)', async () => {
    useCartStore.getState().setItems([createMockCartItem('product-1', 9)])
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    // Available to add = 10 - 9 = 1, default buyCount = 1, so 9 + 1 = 10 = stock → should allow
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).toHaveBeenCalledWith({ product_id: 'product-1', buy_count: 1 })
  })

  it('allows buy now when within stock limit', async () => {
    useCartStore.getState().setItems([])
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    const buyNowBtn = screen.getByText('Mua ngay')
    await user.click(buyNowBtn)
    expect(mockMutateAsync).toHaveBeenCalledWith({ product_id: 'product-1', buy_count: 1 })
  })

  it('redirects to login when not authenticated', async () => {
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={false} reducedMotion={true} />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('validates buy now the same as add to cart', async () => {
    const { toast } = await import('react-toastify')
    useCartStore.getState().setItems([createMockCartItem('product-1', 10)])
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    const buyNowBtn = screen.getByText('Mua ngay')
    await user.click(buyNowBtn)
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
  })

  it('shows remaining count in error when partial overflow on add to cart', async () => {
    const { toast } = await import('react-toastify')
    // Render with empty cart so max=10, then increase buyCount to 5
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    // Increase buyCount to 5 by clicking increase button 4 times
    const increaseBtn = screen.getByLabelText('Increase quantity')
    await user.click(increaseBtn) // 2
    await user.click(increaseBtn) // 3
    await user.click(increaseBtn) // 4
    await user.click(increaseBtn) // 5
    // Now update cart store to have 8 items (availableToAdd becomes 2, but buyCount stays at 5)
    useCartStore.getState().setItems([createMockCartItem('product-1', 8)])
    // Click add to cart — validation: 8 + 5 = 13 > 10 → error with remaining count
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('8'),
      expect.objectContaining({ autoClose: 3000, position: 'top-center' }),
    )
  })

  it('prevents buy now with partial overflow and shows error', async () => {
    const { toast } = await import('react-toastify')
    // Same race condition scenario for buy now
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    const increaseBtn = screen.getByLabelText('Increase quantity')
    await user.click(increaseBtn) // 2
    await user.click(increaseBtn) // 3
    await user.click(increaseBtn) // 4
    // buyCount = 4, now update cart to have 9 items
    useCartStore.getState().setItems([createMockCartItem('product-1', 9)])
    const buyNowBtn = screen.getByText('Mua ngay')
    await user.click(buyNowBtn)
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('9'),
      expect.objectContaining({ autoClose: 3000, position: 'top-center' }),
    )
  })

  it('shows error toast and does not navigate when buy now API fails', async () => {
    const { toast } = await import('react-toastify')
    mockMutateAsync.mockRejectedValueOnce(new Error('API error'))
    renderWithProviders(
      <ProductActions product={mockProduct as any} isAuthenticated={true} reducedMotion={true} />,
    )
    const buyNowBtn = screen.getByText('Mua ngay')
    await user.click(buyNowBtn)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
    // mutateAsync was called (validation passed) but API failed
    expect(mockMutateAsync).toHaveBeenCalledWith({ product_id: 'product-1', buy_count: 1 })
  })
})

// Mock SKU data for variant tests
// Use a valid 24-hex ObjectId so isValidObjectId returns true and sku_id is included
const mockSKU = {
  _id: 'aabbccddeeff001122334455',
  value: 'RED-M',
  price: 95000,
  stock: 15,
  variant_values: { color: 'red', size: 'M' },
}

const mockOutOfStockSKU = {
  _id: 'aabbccddeeff001122334456',
  value: 'BLUE-L',
  price: 100000,
  stock: 0,
  variant_values: { color: 'blue', size: 'L' },
}

describe('ProductActions - Variant Selection (Task 15.9)', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    useCartStore.getState().setItems([])
    mockMutateAsync.mockResolvedValue({ data: { data: { _id: 'purchase-1' } } })
  })

  it('shows error when trying to add to cart without selecting variant', async () => {
    const { toast } = await import('react-toastify')
    const mockOnVariantError = vi.fn()
    renderWithProviders(
      <ProductActions
        product={mockProduct as any}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={null}
        onVariantValidationError={mockOnVariantError}
      />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
    expect(mockOnVariantError).toHaveBeenCalled()
  })

  it('allows add to cart when variant is selected', async () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct as any}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={mockSKU as any}
      />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).toHaveBeenCalledWith({
      product_id: 'product-1',
      buy_count: 1,
      sku_id: 'aabbccddeeff001122334455',
    })
  })

  it('includes sku_id in add to cart request when variant selected', async () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct as any}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={mockSKU as any}
      />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ sku_id: 'aabbccddeeff001122334455' }),
    )
  })

  it('disables add to cart when selected SKU is out of stock', () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct as any}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={mockOutOfStockSKU as any}
      />,
    )
    const addBtn = screen.getByRole('button', { name: /Thêm vào giỏ hàng/i })
    expect(addBtn).toBeDisabled()
  })

  it('disables buy now when selected SKU is out of stock', () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct as any}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={mockOutOfStockSKU as any}
      />,
    )
    const buyNowBtn = screen.getByRole('button', { name: /Mua ngay/i })
    expect(buyNowBtn).toBeDisabled()
  })

  it('shows SKU stock in available quantity text', () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct as any}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={mockSKU as any}
      />,
    )
    // Should show SKU stock (15) instead of product quantity (10)
    expect(screen.getByText(/15\s+Sản phẩm có sẵn/)).toBeInTheDocument()
  })

  it('shows error when trying to buy now without selecting variant', async () => {
    const { toast } = await import('react-toastify')
    const mockOnVariantError = vi.fn()
    renderWithProviders(
      <ProductActions
        product={mockProduct as any}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={null}
        onVariantValidationError={mockOnVariantError}
      />,
    )
    const buyNowBtn = screen.getByText('Mua ngay')
    await user.click(buyNowBtn)
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
    expect(mockOnVariantError).toHaveBeenCalled()
  })

  it('allows buy now when variant is selected', async () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct as any}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={mockSKU as any}
      />,
    )
    const buyNowBtn = screen.getByText('Mua ngay')
    await user.click(buyNowBtn)
    expect(mockMutateAsync).toHaveBeenCalledWith({
      product_id: 'product-1',
      buy_count: 1,
      sku_id: 'aabbccddeeff001122334455',
    })
  })

  it('works normally for products without variants', async () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct as any}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={false}
        selectedSKU={null}
      />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    // Should not include sku_id for non-variant products
    expect(mockMutate).toHaveBeenCalledWith({ product_id: 'product-1', buy_count: 1 })
  })

  it('validates cart quantity against SKU stock when variant selected', async () => {
    const { toast } = await import('react-toastify')
    // SKU has stock of 15, add 15 items to cart — item must carry the matching sku._id
    // so getProductQuantityInCart(..., skuId) finds the exact line instead of returning 0
    useCartStore
      .getState()
      .setItems([{ ...createMockCartItem('product-1', 15), sku: { _id: mockSKU._id } }])
    renderWithProviders(
      <ProductActions
        product={mockProduct as any}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={mockSKU as any}
      />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// sku_id ObjectId guard (Task 3.1–3.3 / cart-sku-validation spec)
// ---------------------------------------------------------------------------

const VALID_OBJECT_ID = 'aabbccddeeff001122334455'
const MOCK_SKU_ID = 'mock-sku-0'

const makeSKU = (id: string, stock = 5): ProductSKU => ({
  _id: id,
  value: 'X',
  price: 100000,
  stock,
  variant_values: {},
})

describe('ProductActions - sku_id ObjectId guard (cart-sku-validation)', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    useCartStore.getState().setItems([])
    mockMutateAsync.mockResolvedValue({ data: { data: { _id: 'purchase-1' } } })
  })

  it('addToCart omits sku_id when selectedSKU._id is a mock/non-ObjectId', async () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={makeSKU(MOCK_SKU_ID)}
      />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).toHaveBeenCalledWith(
      expect.not.objectContaining({ sku_id: expect.anything() }),
    )
  })

  it('addToCart includes sku_id when selectedSKU._id is a valid 24-hex ObjectId', async () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={makeSKU(VALID_OBJECT_ID)}
      />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({ sku_id: VALID_OBJECT_ID }))
  })

  it('addToCart omits sku_id when selectedSKU is undefined', async () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={false}
        selectedSKU={undefined}
      />,
    )
    const addBtn = screen.getByText('Thêm vào giỏ hàng')
    await user.click(addBtn)
    expect(mockMutate).toHaveBeenCalledWith(
      expect.not.objectContaining({ sku_id: expect.anything() }),
    )
  })

  it('handleBuyNow omits sku_id when selectedSKU._id is a mock/non-ObjectId', async () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={makeSKU(MOCK_SKU_ID)}
      />,
    )
    const buyNowBtn = screen.getByText('Mua ngay')
    await user.click(buyNowBtn)
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.not.objectContaining({ sku_id: expect.anything() }),
    )
  })

  it('handleBuyNow includes sku_id when selectedSKU._id is a valid 24-hex ObjectId', async () => {
    renderWithProviders(
      <ProductActions
        product={mockProduct}
        isAuthenticated={true}
        reducedMotion={true}
        hasVariants={true}
        selectedSKU={makeSKU(VALID_OBJECT_ID)}
      />,
    )
    const buyNowBtn = screen.getByText('Mua ngay')
    await user.click(buyNowBtn)
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sku_id: VALID_OBJECT_ID }),
    )
  })
})
