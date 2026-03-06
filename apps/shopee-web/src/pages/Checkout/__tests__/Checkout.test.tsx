import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import Checkout from '../Checkout'
import { ExtendedPurchase } from 'src/types/purchases.type'
import { Product } from 'src/types/product.type'
import { useCartStore } from 'src/stores/cart.store'

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock ImageWithFallback component
vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ src, alt, className }: any) => <img src={src} alt={alt} className={className} />
}))

// Mock child components to avoid render issues
vi.mock('src/components/AddressSelector', () => ({
  default: ({ onAddressSelect }: any) => (
    <div data-testid='address-selector'>
      <button
        onClick={() =>
          onAddressSelect?.({ id: '1', name: 'Test', phone: '0123456789', address: '123 Test St', isDefault: true })
        }
      >
        Select Address
      </button>
    </div>
  )
}))

vi.mock('src/components/ShippingMethodSelector', () => ({
  default: ({ onSelect }: any) => (
    <div data-testid='shipping-selector'>
      <button onClick={() => onSelect?.({ id: '1', name: 'Standard', price: 30000, estimatedDays: '3-5 ngày' })}>
        Select Shipping
      </button>
    </div>
  )
}))

vi.mock('src/components/PaymentMethodSelector', () => ({
  default: ({ onSelect }: any) => (
    <div data-testid='payment-selector'>
      <button onClick={() => onSelect?.('cod')}>Select Payment</button>
    </div>
  )
}))

vi.mock('src/components/OrderSummary', () => ({
  default: ({ items, shippingMethod, voucherDiscount }: any) => (
    <div data-testid='order-summary'>
      <p>Tổng tiền hàng: {items?.length || 0} sản phẩm</p>
      <p>Phí vận chuyển: {shippingMethod?.price || 0}</p>
      <p>Giảm giá voucher: {voucherDiscount || 0}</p>
    </div>
  )
}))

// Create mock product
const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  _id: 'product-1',
  name: 'Test Product',
  price: 100000,
  price_before_discount: 150000,
  image: 'https://example.com/image.jpg',
  images: ['https://example.com/image.jpg'],
  quantity: 100,
  sold: 50,
  view: 1000,
  rating: 4.5,
  category: { _id: 'cat-1', name: 'Electronics' },
  description: 'Test description',
  location: 'Ho Chi Minh',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides
})

// Create mock extended purchase
const createMockExtendedPurchase = (overrides: Partial<ExtendedPurchase> = {}): ExtendedPurchase => ({
  _id: 'purchase-1',
  buy_count: 2,
  price: 100000,
  price_before_discount: 150000,
  status: -1,
  user: 'user-1',
  product: createMockProduct(),
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  isChecked: true,
  disabled: false,
  ...overrides
})

let queryClient: QueryClient

const createWrapper = (initialPurchases: ExtendedPurchase[] = []) => {
  useCartStore.setState({ items: initialPurchases })
  return ({ children }: { children: React.ReactNode }) => {
    return (
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/checkout']}>{children}</MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>
    )
  }
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

describe('Checkout Page', () => {
  describe('Rendering', () => {
    test('should redirect to cart when no checked items', async () => {
      const { toast } = await import('react-toastify')

      render(<Checkout />, {
        wrapper: createWrapper([]) // Empty purchases
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/cart')
        expect(toast.warning).toHaveBeenCalledWith('Vui lòng chọn sản phẩm để thanh toán')
      })
    })

    test('should render checkout page with checked items', async () => {
      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      await waitFor(() => {
        // Use getAllByText since "Thanh toán" appears in both header and progress stepper
        const thanhToanElements = screen.getAllByText('Thanh toán')
        expect(thanhToanElements.length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Hoàn tất đơn hàng của bạn')).toBeInTheDocument()
      })
    })

    test('should render progress stepper', async () => {
      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      await waitFor(() => {
        expect(screen.getByText('Địa chỉ')).toBeInTheDocument()
        expect(screen.getByText('Vận chuyển')).toBeInTheDocument()
        // Use getAllByText since "Thanh toán" appears multiple times
        const thanhToanElements = screen.getAllByText('Thanh toán')
        expect(thanhToanElements.length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Xác nhận')).toBeInTheDocument()
      })
    })

    test('should render section headers', async () => {
      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      await waitFor(() => {
        expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument()
        expect(screen.getByText('Phương thức vận chuyển')).toBeInTheDocument()
        expect(screen.getByText('Phương thức thanh toán')).toBeInTheDocument()
      })
    })

    test('should render security badge', async () => {
      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      await waitFor(() => {
        expect(screen.getByText('Thanh toán an toàn & bảo mật')).toBeInTheDocument()
      })
    })
  })

  describe('Voucher & Coins', () => {
    test('should render voucher input field', async () => {
      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Nhập mã voucher')).toBeInTheDocument()
        expect(screen.getByText('Áp dụng')).toBeInTheDocument()
      })
    })

    test('should apply valid voucher code GIAM10', async () => {
      const { toast } = await import('react-toastify')
      const user = userEvent.setup()

      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      const voucherInput = await screen.findByPlaceholderText('Nhập mã voucher')
      await user.type(voucherInput, 'GIAM10')

      const applyButton = screen.getByText('Áp dụng')
      await user.click(applyButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Áp dụng voucher thành công! Giảm 10.000đ')
      })
    })

    test('should apply valid voucher code GIAM50K', async () => {
      const { toast } = await import('react-toastify')
      const user = userEvent.setup()

      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      const voucherInput = await screen.findByPlaceholderText('Nhập mã voucher')
      await user.type(voucherInput, 'GIAM50K')

      const applyButton = screen.getByText('Áp dụng')
      await user.click(applyButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Áp dụng voucher thành công! Giảm 50.000đ')
      })
    })

    test('should show error for invalid voucher code', async () => {
      const { toast } = await import('react-toastify')
      const user = userEvent.setup()

      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      const voucherInput = await screen.findByPlaceholderText('Nhập mã voucher')
      await user.type(voucherInput, 'INVALID_CODE')

      const applyButton = screen.getByText('Áp dụng')
      await user.click(applyButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Mã voucher không hợp lệ. Thử: GIAM10, GIAM50K, DISCOUNT50, FREESHIP, NEWUSER'
        )
      })
    })
  })

  describe('Form Validation', () => {
    test('should disable place order button when address is not selected', async () => {
      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      // Wait for the page to render
      await waitFor(() => {
        expect(screen.getByText('Hoàn tất đơn hàng của bạn')).toBeInTheDocument()
      })

      // Find place order button by role - it should be disabled when no address is selected
      const placeOrderButton = screen.getByRole('button', { name: /Đặt hàng ngay/i })
      expect(placeOrderButton).toBeDisabled()
    })

    test('should have place order button in the page', async () => {
      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Đặt hàng ngay/i })).toBeInTheDocument()
      })
    })
  })

  describe('Order Summary', () => {
    test('should display product information in order summary', async () => {
      render(<Checkout />, {
        wrapper: createWrapper([createMockExtendedPurchase()])
      })

      await waitFor(() => {
        // Check that order summary section exists
        expect(screen.getByText(/Tổng tiền hàng/i)).toBeInTheDocument()
      })
    })
  })
})
