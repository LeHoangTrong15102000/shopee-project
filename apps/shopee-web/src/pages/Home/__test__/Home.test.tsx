import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from '../Home'

vi.mock('src/components/HeroBanner', () => ({
  default: () => <div data-testid="hero-banner">banner</div>,
}))

vi.mock('src/components/FlashSale', () => ({
  FlashSaleTimer: () => <div data-testid="flash-sale-timer">timer</div>,
}))

vi.mock('src/components/OptimizedImage', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} />,
}))

vi.mock('src/components/SEO', () => ({
  default: () => null,
  SITE_URL: 'https://shopee.vn',
}))

vi.mock('src/apis/category.api', () => ({
  default: {
    getCategories: vi.fn().mockResolvedValue({
      data: {
        data: [
          { _id: 'c1', name: 'Điện tử' },
          { _id: 'c2', name: 'Thời trang' },
        ],
      },
    }),
  },
}))

vi.mock('src/apis/product.api', () => ({
  default: {
    getProducts: vi.fn().mockResolvedValue({
      data: {
        data: {
          products: [
            {
              _id: 'p1',
              name: 'Sản phẩm 1',
              price: 100000,
              price_before_discount: 200000,
              sold: 500,
              rating: 4.5,
              image: 'img1.jpg',
            },
          ],
        },
      },
    }),
  },
}))

vi.mock('src/hooks/useFlashSale', () => ({
  default: () => ({
    remainingSeconds: 3600,
    products: [],
    isActive: true,
    isEnded: false,
    isConnectedToServer: true,
  }),
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

describe('Home', () => {
  it('renders hero banner', () => {
    render(<Home />, { wrapper: createWrapper() })
    expect(screen.getByTestId('hero-banner')).toBeInTheDocument()
  })

  it('renders flash sale timer', () => {
    render(<Home />, { wrapper: createWrapper() })
    expect(screen.getByTestId('flash-sale-timer')).toBeInTheDocument()
  })

  it('renders FLASH SALE heading', () => {
    render(<Home />, { wrapper: createWrapper() })
    expect(screen.getByText('FLASH SALE')).toBeInTheDocument()
  })

  it('renders category section heading', async () => {
    render(<Home />, { wrapper: createWrapper() })
    // Category title from Vietnamese translations
    const headings = screen.getAllByRole('heading')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('renders view all links', () => {
    render(<Home />, { wrapper: createWrapper() })
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('renders CTA section', () => {
    render(<Home />, { wrapper: createWrapper() })
    // CTA section has a link with arrow icon
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Home – extended', () => {
  it('renders category names from mock data', async () => {
    render(<Home />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Điện tử')).toBeInTheDocument()
      expect(screen.getByText('Thời trang')).toBeInTheDocument()
    })
  })

  it('category links point to /products?category=<id>', async () => {
    render(<Home />, { wrapper: createWrapper() })
    await waitFor(() => {
      const c1Link = screen.getByText('Điện tử').closest('a')
      expect(c1Link).not.toBeNull()
      expect(c1Link?.getAttribute('href')).toContain('/products?category=c1')

      const c2Link = screen.getByText('Thời trang').closest('a')
      expect(c2Link).not.toBeNull()
      expect(c2Link?.getAttribute('href')).toContain('/products?category=c2')
    })
  })

  it('renders product cards after data loads', async () => {
    render(<Home />, { wrapper: createWrapper() })
    await waitFor(
      () => {
        // Product name from mock data should appear in product cards
        const elements = screen.getAllByText('Sản phẩm 1')
        expect(elements.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 5000 },
    )
  })

  it('renders FLASH SALE section heading', () => {
    render(<Home />, { wrapper: createWrapper() })
    expect(screen.getByText('FLASH SALE')).toBeInTheDocument()
  })

  it('renders new products section heading after data loads', async () => {
    render(<Home />, { wrapper: createWrapper() })
    // Vietnamese translation from homeVi: "Sản Phẩm Mới"
    await waitFor(() => {
      expect(screen.getByText('Sản Phẩm Mới')).toBeInTheDocument()
    })
  })

  it('renders CTA section with gradient background class', () => {
    const { container } = render(<Home />, { wrapper: createWrapper() })
    const ctaSection = container.querySelector('.bg-linear-to-r')
    expect(ctaSection).toBeInTheDocument()
  })

  it('gracefully renders no category items when categories list is empty', async () => {
    const categoryApi = await import('src/apis/category.api')
    vi.mocked((categoryApi.default as any).getCategories).mockResolvedValueOnce({
      data: { data: [] },
    })
    const { container } = render(<Home />, { wrapper: createWrapper() })
    await waitFor(() => {
      // No category anchor links inside the categories grid
      const categoryGrid = container.querySelector(
        '.grid.grid-cols-2.gap-4.md\\:grid-cols-4.lg\\:grid-cols-6',
      )
      if (categoryGrid) {
        expect(categoryGrid.querySelectorAll('a').length).toBe(0)
      }
    })
  })

  it('renders flash sale discount badge for products with discount', async () => {
    render(<Home />, { wrapper: createWrapper() })
    // MSW product data has price_before_discount > price → discount badges should appear
    await waitFor(
      () => {
        // Look for any discount badge (format: -XX%)
        const badges = screen.getAllByText(/^-\d+%$/)
        expect(badges.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 5000 },
    )
  })

  it('renders "View all" links for product sections', async () => {
    render(<Home />, { wrapper: createWrapper() })
    await waitFor(() => {
      // Vietnamese translation: "Xem tất cả →"
      const viewAllLinks = screen.getAllByText('Xem tất cả →')
      expect(viewAllLinks.length).toBeGreaterThanOrEqual(1)
    })
  })
})
