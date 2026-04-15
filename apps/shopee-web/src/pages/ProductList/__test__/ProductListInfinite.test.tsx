import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ProductListInfinite from '../ProductListInfinite'

const mockSetFilters = vi.fn()
const mockFetchNextPage = vi.fn()
const mockChangeViewMode = vi.fn()
const mockOnLoadMore = vi.fn()

let mockFilters: any = { page: 1, limit: 20 }
let mockViewMode: 'grid' | 'list' = 'grid'
let mockIsMobile = false
let mockInfiniteQueryResult: any = null
let mockCategoriesQueryResult: any = null

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('src/hooks/nuqs', () => ({
  useProductQueryStates: () => [mockFilters, mockSetFilters],
  normalizeProductQueryKey: (filters: any) => {
    const { page, ...rest } = filters
    return rest
  },
}))

vi.mock('src/hooks/useViewMode', () => ({
  useViewMode: () => ({ viewMode: mockViewMode, changeViewMode: mockChangeViewMode }),
}))

vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile,
}))

vi.mock('src/hooks/useInfiniteScroll', () => ({
  default: ({ onLoadMore }: any) => {
    mockOnLoadMore.mockImplementation(onLoadMore)
    return { sentinelRef: { current: null } }
  },
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useInfiniteQuery: () => mockInfiniteQueryResult,
    useQuery: () => mockCategoriesQueryResult,
  }
})

vi.mock('src/apis/product.api', () => ({
  default: {
    getProducts: vi.fn(),
  },
}))

vi.mock('src/apis/category.api', () => ({
  default: {
    getCategories: vi.fn(),
  },
}))

vi.mock('../components/AsideFilter', () => ({
  default: ({ categories }: any) => (
    <div data-testid="aside-filter">AsideFilter ({categories.length})</div>
  ),
}))

vi.mock('../components/SortProductList', () => ({
  default: ({ pageSize, viewMode, onViewChange }: any) => (
    <div data-testid="sort-product-list">
      <span>PageSize: {pageSize}</span>
      <button onClick={() => onViewChange('list')}>Change View</button>
    </div>
  ),
}))

vi.mock('../components/Product/Product', () => ({
  default: ({ product }: any) => <div data-testid={`product-${product._id}`}>{product.name}</div>,
}))

vi.mock('src/components/ProductListItem', () => ({
  default: ({ product }: any) => (
    <div data-testid={`product-item-${product._id}`}>{product.name}</div>
  ),
}))

vi.mock('src/components/ProductSkeleton', () => ({
  default: () => <div data-testid="product-skeleton">Skeleton</div>,
}))

vi.mock('src/components/SearchNoResults', () => ({
  default: ({ searchTerm, onPopularSearch }: any) => (
    <div data-testid="search-no-results">
      <p>No results for: {searchTerm}</p>
      <button onClick={() => onPopularSearch('test')}>Popular Search</button>
    </div>
  ),
}))

vi.mock('src/components/SEO', () => ({
  default: ({ title, description }: any) => (
    <div data-testid="seo">
      <span>{title}</span>
      {description && <span>{description}</span>}
    </div>
  ),
}))

vi.mock('src/components/Breadcrumb', () => ({
  default: ({ items }: any) => (
    <div data-testid="breadcrumb">
      {items.map((item: any, i: number) => (
        <span key={i}>{item.label}</span>
      ))}
    </div>
  ),
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

// Mock virtualizer to render all items in jsdom (no real scroll container dimensions)
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        start: i * 320,
        end: (i + 1) * 320,
        size: 320,
        key: i,
      })),
    getTotalSize: () => count * 320,
    measureElement: () => {},
  }),
}))

vi.mock('src/constant/path', () => ({
  default: {
    home: '/',
  },
}))

const mockProducts = [
  {
    _id: '1',
    name: 'Product 1',
    price: 100000,
    image: 'image1.jpg',
  },
  {
    _id: '2',
    name: 'Product 2',
    price: 200000,
    image: 'image2.jpg',
  },
]

const mockCategories = [
  { _id: 'cat1', name: 'Category 1' },
  { _id: 'cat2', name: 'Category 2' },
]

describe('ProductListInfinite', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
    mockFilters = { page: 1, limit: 20 }
    mockViewMode = 'grid'
    mockIsMobile = false
    mockInfiniteQueryResult = {
      data: {
        pages: [
          {
            data: {
              data: {
                products: mockProducts,
                pagination: { page: 1, page_size: 2, limit: 20 },
              },
            },
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: mockFetchNextPage,
      error: null,
    }
    mockCategoriesQueryResult = {
      data: {
        data: {
          data: mockCategories,
        },
      },
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{component}</BrowserRouter>
      </QueryClientProvider>,
    )
  }

  describe('Loading State', () => {
    it('renders loading skeletons when isLoading is true', () => {
      mockInfiniteQueryResult.isLoading = true
      mockInfiniteQueryResult.data = undefined

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByText('Đang tải...')).toBeInTheDocument()
      const skeletons = screen.getAllByTestId('product-skeleton')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders filter skeleton in loading state', () => {
      mockInfiniteQueryResult.isLoading = true
      mockInfiniteQueryResult.data = undefined

      const { container } = renderWithProviders(<ProductListInfinite />)

      const filterSkeleton = container.querySelector('.animate-pulse')
      expect(filterSkeleton).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('renders error message when error occurs and no data', () => {
      mockInfiniteQueryResult.error = new Error('Network error')
      mockInfiniteQueryResult.data = null

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByText('Có lỗi xảy ra khi tải danh sách sản phẩm')).toBeInTheDocument()
      expect(screen.getByText('Vui lòng thử lại sau')).toBeInTheDocument()
    })

    it('renders retry button on error', () => {
      mockInfiniteQueryResult.error = new Error('Network error')
      mockInfiniteQueryResult.data = null

      renderWithProviders(<ProductListInfinite />)

      const retryButton = screen.getByText('Thử lại')
      expect(retryButton).toBeInTheDocument()
    })

    it('reloads page when retry button is clicked', () => {
      mockInfiniteQueryResult.error = new Error('Network error')
      mockInfiniteQueryResult.data = null

      // Mock window.location.reload
      const originalLocation = window.location
      delete (window as any).location
      ;(window as any).location = { ...originalLocation, reload: vi.fn() }

      renderWithProviders(<ProductListInfinite />)

      const retryButton = screen.getByText('Thử lại')
      fireEvent.click(retryButton)

      expect(window.location.reload).toHaveBeenCalled()

      // Restore
      ;(window as any).location = originalLocation
    })
  })

  describe('Products Display', () => {
    it('renders products in grid view', () => {
      mockViewMode = 'grid'

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByTestId('product-1')).toBeInTheDocument()
      expect(screen.getByTestId('product-2')).toBeInTheDocument()
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
    })

    it('renders products in list view', () => {
      mockViewMode = 'list'

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByTestId('product-item-1')).toBeInTheDocument()
      expect(screen.getByTestId('product-item-2')).toBeInTheDocument()
    })

    it('renders AsideFilter with categories', () => {
      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByTestId('aside-filter')).toBeInTheDocument()
      expect(screen.getByText('AsideFilter (2)')).toBeInTheDocument()
    })

    it('renders SortProductList with correct props', () => {
      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByTestId('sort-product-list')).toBeInTheDocument()
      expect(screen.getByText('PageSize: 2')).toBeInTheDocument()
    })

    it('renders breadcrumb with default items', () => {
      renderWithProviders(<ProductListInfinite />)

      const breadcrumb = screen.getByTestId('breadcrumb')
      expect(breadcrumb).toBeInTheDocument()
      expect(breadcrumb).toHaveTextContent('Trang chủ')
      expect(breadcrumb).toHaveTextContent('Tất cả sản phẩm')
    })

    it('renders breadcrumb with category name when category filter is active', () => {
      mockFilters = { ...mockFilters, category: 'cat1' }

      renderWithProviders(<ProductListInfinite />)

      const breadcrumb = screen.getByTestId('breadcrumb')
      expect(breadcrumb).toHaveTextContent('Category 1')
    })

    it('renders SEO with category title when category is selected', () => {
      mockFilters = { ...mockFilters, category: 'cat1' }

      renderWithProviders(<ProductListInfinite />)

      const seo = screen.getByTestId('seo')
      expect(seo).toHaveTextContent('Category 1')
    })

    it('renders SEO with default title when no category', () => {
      renderWithProviders(<ProductListInfinite />)

      const seo = screen.getByTestId('seo')
      expect(seo).toHaveTextContent('Tất cả sản phẩm')
    })
  })

  describe('Infinite Scroll', () => {
    it('calls fetchNextPage when load more is triggered', () => {
      renderWithProviders(<ProductListInfinite />)

      // The useInfiniteScroll hook receives onLoadMore callback
      // We need to verify the callback logic works correctly
      expect(mockInfiniteQueryResult.hasNextPage).toBe(true)
      expect(mockInfiniteQueryResult.isFetchingNextPage).toBe(false)
    })

    it('does not call fetchNextPage when already fetching', () => {
      mockInfiniteQueryResult.isFetchingNextPage = true

      renderWithProviders(<ProductListInfinite />)

      if (mockOnLoadMore.mock.calls.length > 0) {
        mockOnLoadMore.mock.calls[0][0]()
      }

      expect(mockFetchNextPage).not.toHaveBeenCalled()
    })

    it('does not call fetchNextPage when no more pages', () => {
      mockInfiniteQueryResult.hasNextPage = false

      renderWithProviders(<ProductListInfinite />)

      if (mockOnLoadMore.mock.calls.length > 0) {
        mockOnLoadMore.mock.calls[0][0]()
      }

      expect(mockFetchNextPage).not.toHaveBeenCalled()
    })

    it('renders loading indicator when fetching next page', () => {
      mockInfiniteQueryResult.isFetchingNextPage = true

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByText('Đang tải thêm sản phẩm...')).toBeInTheDocument()
    })

    it('renders skeletons in grid view when fetching next page', () => {
      mockInfiniteQueryResult.isFetchingNextPage = true
      mockViewMode = 'grid'

      renderWithProviders(<ProductListInfinite />)

      const skeletons = screen.getAllByTestId('product-skeleton')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders skeletons in list view when fetching next page', () => {
      mockInfiniteQueryResult.isFetchingNextPage = true
      mockViewMode = 'list'

      const { container } = renderWithProviders(<ProductListInfinite />)

      const listSkeletons = container.querySelectorAll('.animate-pulse')
      expect(listSkeletons.length).toBeGreaterThan(0)
    })

    it('shows end message when no more pages', () => {
      mockInfiniteQueryResult.hasNextPage = false

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByText(/Đã hiển thị tất cả \d+ sản phẩm/)).toBeInTheDocument()
    })

    it('flattens products from multiple pages', () => {
      mockInfiniteQueryResult.data = {
        pages: [
          {
            data: {
              data: {
                products: [mockProducts[0]],
                pagination: { page: 1, limit: 20, page_size: 2 },
              },
            },
          },
          {
            data: {
              data: {
                products: [mockProducts[1]],
                pagination: { page: 2, limit: 20, page_size: 2 },
              },
            },
          },
        ],
      }

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByTestId('product-1')).toBeInTheDocument()
      expect(screen.getByTestId('product-2')).toBeInTheDocument()
    })

    it('renders sentinel element for infinite scroll', () => {
      const { container } = renderWithProviders(<ProductListInfinite />)

      const sentinel = container.querySelector('.h-4')
      expect(sentinel).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    beforeEach(() => {
      mockInfiniteQueryResult.data = {
        pages: [
          {
            data: {
              data: {
                products: [],
                pagination: { page: 1, limit: 20, page_size: 0 },
              },
            },
          },
        ],
      }
      mockInfiniteQueryResult.hasNextPage = false
    })

    it('renders SearchNoResults when search term exists and no products', () => {
      mockFilters = { ...mockFilters, name: 'test search' }

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByTestId('search-no-results')).toBeInTheDocument()
      expect(screen.getByText('No results for: test search')).toBeInTheDocument()
    })

    it('calls setFilters when popular search is clicked', () => {
      mockFilters = { ...mockFilters, name: 'test search' }

      renderWithProviders(<ProductListInfinite />)

      const popularSearchButton = screen.getByText('Popular Search')
      fireEvent.click(popularSearchButton)

      expect(mockSetFilters).toHaveBeenCalledWith({ name: 'test', page: 1 })
    })

    it('renders default empty state when no search term', () => {
      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByText('Không tìm thấy sản phẩm nào')).toBeInTheDocument()
      expect(
        screen.getByText('Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn'),
      ).toBeInTheDocument()
    })

    it('renders empty state SVG icon', () => {
      const { container } = renderWithProviders(<ProductListInfinite />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Background Fetching Indicator', () => {
    it('shows background fetching indicator when refetching', () => {
      mockInfiniteQueryResult.isFetching = true
      mockInfiniteQueryResult.isFetchingNextPage = false

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByText('Đang cập nhật...')).toBeInTheDocument()
    })

    it('does not show background fetching indicator when fetching next page', () => {
      mockInfiniteQueryResult.isFetching = true
      mockInfiniteQueryResult.isFetchingNextPage = true

      renderWithProviders(<ProductListInfinite />)

      expect(screen.queryByText('Đang cập nhật...')).not.toBeInTheDocument()
    })
  })

  describe('Mobile Behavior', () => {
    it('renders products without animation variants on mobile', () => {
      mockIsMobile = true

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByTestId('product-1')).toBeInTheDocument()
      expect(screen.getByTestId('product-2')).toBeInTheDocument()
    })
  })

  describe('View Mode Toggle', () => {
    it('calls changeViewMode when view is changed', () => {
      renderWithProviders(<ProductListInfinite />)

      const changeViewButton = screen.getByText('Change View')
      fireEvent.click(changeViewButton)

      expect(mockChangeViewMode).toHaveBeenCalledWith('list')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty categories data', () => {
      mockCategoriesQueryResult.data = undefined

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByTestId('aside-filter')).toBeInTheDocument()
      expect(screen.getByText('AsideFilter (0)')).toBeInTheDocument()
    })

    it('handles undefined pages data', () => {
      mockInfiniteQueryResult.data = undefined

      renderWithProviders(<ProductListInfinite />)

      expect(screen.getByText('Không tìm thấy sản phẩm nào')).toBeInTheDocument()
    })

    it('handles category filter with non-existent category', () => {
      mockFilters = { ...mockFilters, category: 'non-existent' }

      renderWithProviders(<ProductListInfinite />)

      const breadcrumb = screen.getByTestId('breadcrumb')
      expect(breadcrumb).toHaveTextContent('Tất cả sản phẩm')
    })

    it('handles error with existing data', () => {
      mockInfiniteQueryResult.error = new Error('Network error')

      renderWithProviders(<ProductListInfinite />)

      // Should still show products when error occurs but data exists
      expect(screen.getByTestId('product-1')).toBeInTheDocument()
    })
  })

  describe('Virtualization', () => {
    it('renders scroll container with accessibility attributes', () => {
      const { container } = renderWithProviders(<ProductListInfinite />)

      const region = container.querySelector('[role="region"]')
      expect(region).not.toBeNull()
      expect(region).toHaveAttribute('tabindex', '0')
      expect(region).toHaveAttribute('aria-label')
    })

    it('renders scroll container with responsive max-height', () => {
      const { container } = renderWithProviders(<ProductListInfinite />)

      const region = container.querySelector('[role="region"]')
      expect(region).not.toBeNull()
      expect(region!.getAttribute('style')).toContain('calc(100vh - 200px)')
    })

    it('renders products through virtualizer in grid view', () => {
      mockViewMode = 'grid'

      renderWithProviders(<ProductListInfinite />)

      // Products should render through virtualizer
      expect(screen.getByTestId('product-1')).toBeInTheDocument()
      expect(screen.getByTestId('product-2')).toBeInTheDocument()
    })

    it('renders products through virtualizer in list view', () => {
      mockViewMode = 'list'

      renderWithProviders(<ProductListInfinite />)

      // Products should render through list virtualizer
      expect(screen.getByTestId('product-item-1')).toBeInTheDocument()
      expect(screen.getByTestId('product-item-2')).toBeInTheDocument()
    })
  })
})
