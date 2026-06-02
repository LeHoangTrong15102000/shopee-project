import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithRouter } from 'src/utils/testUtils'

// Mock all heavy WebSocket hooks
vi.mock('src/hooks/useLivePriceUpdate', () => ({
  default: vi.fn(() => ({
    price: null,
    priceBeforeDiscount: null,
    hasChanged: false,
    previousPrice: null,
  })),
}))

vi.mock('src/hooks/useViewerCount', () => ({
  default: vi.fn(() => ({ viewerCount: 0, isPopular: false })),
}))

vi.mock('src/hooks/useLiveReviews', () => ({
  default: vi.fn(() => ({
    newReviews: [],
    newComments: [],
    likeUpdates: [],
    clearNewReviews: vi.fn(),
  })),
}))

vi.mock('src/hooks/useLiveQA', () => ({
  default: vi.fn(() => ({
    newQuestions: [],
    newAnswers: [],
    likeUpdates: [],
    clearNewQuestions: vi.fn(),
  })),
}))

vi.mock('src/hooks/useActivityFeed', () => ({
  default: vi.fn(() => ({ latestActivity: null })),
}))

vi.mock('src/hooks/usePresence', () => ({
  default: vi.fn(() => ({ isOnline: false, lastSeen: null })),
}))

vi.mock('src/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: vi.fn(() => ({ addProduct: vi.fn(), recentlyViewed: [] })),
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true),
}))

// Mock heavy child components
vi.mock('src/components/ProductReviews', () => ({
  default: ({ productId }: any) => <div data-testid="product-reviews">Reviews {productId}</div>,
}))

vi.mock('src/components/ProductQA', () => ({
  default: ({ productId }: any) => <div data-testid="product-qa">QA {productId}</div>,
}))

vi.mock('src/components/LiveReviewFeed', () => ({
  default: () => <div data-testid="live-review-feed">LiveReviewFeed</div>,
}))

vi.mock('src/components/LiveQASection', () => ({
  default: () => <div data-testid="live-qa-section">LiveQASection</div>,
}))

vi.mock('src/components/ActivityFeedWidget', () => ({
  default: () => <div data-testid="activity-feed-widget">ActivityFeedWidget</div>,
}))

vi.mock('src/components/SEO', () => ({
  default: ({ title }: any) => <title>{title}</title>,
  SITE_URL: 'https://shopee.vn',
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, variant, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/components/ProductVariantSelector', () => ({
  default: () => <div data-testid="product-variant-selector">VariantSelector</div>,
}))

// Mock ProductImages, ProductInfo, etc. from components barrel
vi.mock('../components', () => ({
  ProductImages: ({ product }: any) => <div data-testid="product-images">{product?.name}</div>,
  ProductInfo: ({ product }: any) => <div data-testid="product-info">{product?.name}</div>,
  ProductActions: () => <div data-testid="product-actions">Actions</div>,
  RelatedProducts: () => <div data-testid="related-products">Related</div>,
  Breadcrumb: ({ productName }: any) => <div data-testid="breadcrumb">{productName}</div>,
  ProductSpecifications: () => <div data-testid="product-specs">Specs</div>,
  ShopInfo: () => <div data-testid="shop-info">ShopInfo</div>,
  ShopProducts: () => <div data-testid="shop-products">ShopProducts</div>,
}))

// The MSW handler returns product with id '60afb2426ef5b902180aacb9'
// URL pattern for useParams to extract id from nameId slug
const PRODUCT_SLUG = '/dien-thoai-oppo-a12-i-60afb2426ef5b902180aacb9'

describe('ProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product images section after data loads', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('product-images')).toBeInTheDocument()
      },
      { timeout: 50000 },
    )
  }, 55000)

  it('renders product name from MSW data (OPPO A12)', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('product-images')).toBeInTheDocument()
      },
      { timeout: 35000 },
    )

    // Product name comes from MSW productDetailRes.data.name
    expect(screen.getAllByText(/OPPO A12/)[0]).toBeInTheDocument()
  }, 40000)

  it('renders breadcrumb after data loads', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
      },
      { timeout: 35000 },
    )
  }, 40000)

  it('renders product info section', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('product-info')).toBeInTheDocument()
      },
      { timeout: 35000 },
    )
  }, 40000)

  it('renders shop info section', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('shop-info')).toBeInTheDocument()
      },
      { timeout: 35000 },
    )
  }, 40000)

  it('renders product reviews section', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('product-reviews')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders product QA section', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('product-qa')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders related products section', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('related-products')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders product actions section', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('product-actions')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders product specifications', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('product-specs')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders shop products section', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('shop-products')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders activity feed widget', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        expect(screen.getByTestId('activity-feed-widget')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('passes product id to product-reviews component', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        const reviewEl = screen.getByTestId('product-reviews')
        expect(reviewEl.textContent).toContain('60afb2426ef5b902180aacb9')
      },
      { timeout: 5000 },
    )
  })

  it('passes product id to product-qa component', async () => {
    renderWithRouter({ route: PRODUCT_SLUG })

    await waitFor(
      () => {
        const qaEl = screen.getByTestId('product-qa')
        expect(qaEl.textContent).toContain('60afb2426ef5b902180aacb9')
      },
      { timeout: 5000 },
    )
  })
})
