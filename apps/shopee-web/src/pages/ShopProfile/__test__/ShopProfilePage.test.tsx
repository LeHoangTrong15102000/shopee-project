import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ShopProfilePage from '../ShopProfilePage'

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useParams: () => ({ id: 'shop-1' }),
    useNavigate: () => vi.fn(),
  }
})

// Mock AppContext so useContext(AppContext) returns unauthenticated state
vi.mock('src/contexts/app.context', () => {
  const { createContext } = require('react')
  const AppContext = createContext({ isAuthenticated: false, profile: null })
  return { AppContext }
})

vi.mock('src/apis/shop.api', () => ({
  default: {
    getShop: vi.fn().mockResolvedValue({
      data: {
        data: {
          _id: 'shop-1',
          name: 'Test Shop',
          description: 'A test shop',
          avatar: null,
          followerCount: 100,
          productCount: 5,
          rating: 4.5,
          isFollowing: false,
        },
      },
    }),
    getShopProducts: vi.fn().mockResolvedValue({
      data: {
        data: {
          products: [],
          pagination: { page_size: 1 },
        },
      },
    }),
    followShop: vi.fn().mockResolvedValue({ data: { data: {} } }),
    unfollowShop: vi.fn().mockResolvedValue({ data: { data: {} } }),
  },
}))

vi.mock('src/apis/shopChat.api', () => ({
  default: {
    createConversation: vi.fn().mockResolvedValue({ data: { data: { _id: 'conv-1' } } }),
  },
}))

vi.mock('src/pages/ProductDetail/components/ShopMetrics', () => ({
  default: ({ rating }: any) => <div data-testid="shop-metrics">Rating: {rating}</div>,
}))

vi.mock('src/pages/ProductList/components/Product', () => ({
  default: ({ product }: any) => <div data-testid={`product-${product._id}`}>{product.name}</div>,
}))

vi.mock('src/components/SEO', () => ({ default: () => null }))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  )
}

describe('ShopProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton initially', () => {
    const { container } = render(<ShopProfilePage />, { wrapper: createWrapper() })
    const pulse = container.querySelector('.animate-pulse')
    expect(pulse).not.toBeNull()
  })

  it('renders shop name after data loads', async () => {
    render(<ShopProfilePage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Test Shop')).toBeInTheDocument()
    })
  })

  it('renders follow button after data loads', async () => {
    render(<ShopProfilePage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('+ Follow')).toBeInTheDocument()
    })
  })

  it('renders chat with shop button after data loads', async () => {
    render(<ShopProfilePage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Chat with shop')).toBeInTheDocument()
    })
  })

  it('renders shop metrics after data loads', async () => {
    render(<ShopProfilePage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByTestId('shop-metrics')).toBeInTheDocument()
    })
  })

  it('renders Products heading after data loads', async () => {
    render(<ShopProfilePage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText(/Products/)).toBeInTheDocument()
    })
  })

  it('renders no products found when products list is empty', async () => {
    render(<ShopProfilePage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument()
    })
  })

  it('renders shop not found when shop is null', async () => {
    const shopApi = await import('src/apis/shop.api')
    vi.mocked(shopApi.default.getShop).mockResolvedValueOnce({
      data: { data: null as any },
    })
    render(<ShopProfilePage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Shop not found')).toBeInTheDocument()
    })
  })
})
