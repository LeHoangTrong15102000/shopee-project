import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HistoryPurchases from '../HistoryPurchases'

let mockUseQueryReturn: any = { data: { data: { data: [] } } }
const mockSetStatus = vi.fn()
let mockUsePurchaseStatusReturn: any = [0, mockSetStatus]
const mockClearAllFilters = vi.fn()
let mockOrderFilterReturn: any = {
  filters: { searchQuery: '', dateRange: null, priceRange: null },
  setSearchQuery: vi.fn(),
  setDateRange: vi.fn(),
  setPriceRange: vi.fn(),
  clearAllFilters: mockClearAllFilters,
  activeFilterCount: 0,
  filterPurchases: (purchases: any) => purchases,
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => mockUseQueryReturn,
}))

vi.mock('src/hooks/nuqs', () => ({
  usePurchaseStatus: () => mockUsePurchaseStatusReturn,
}))

vi.mock('src/hooks/useOrderFilter', () => ({
  useOrderFilter: () => mockOrderFilterReturn,
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))
vi.mock('src/components/SEO', () => ({
  default: () => <div data-testid="seo" />,
}))

vi.mock('src/components/OrderSearchFilter', () => ({
  OrderSearchFilter: ({ totalResults }: any) => (
    <div data-testid="order-search-filter">Results: {totalResults}</div>
  ),
}))

vi.mock('src/components/ProductReviewModal', () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="review-modal">Review Modal</div> : null,
}))

vi.mock('../components', () => ({
  PurchaseTabBar: ({ status, onStatusChange }: any) => (
    <div data-testid="tab-bar" onClick={() => onStatusChange(1)}>
      Status: {status}
    </div>
  ),
  PurchaseItem: ({ purchase, onReviewClick, onToggleTracking }: any) => (
    <div data-testid="purchase-item">
      <div>{purchase.product.name}</div>
      <button onClick={() => onReviewClick(purchase)}>Review</button>
      <button onClick={() => onToggleTracking(purchase._id)}>Track</button>
    </div>
  ),
}))

describe('HistoryPurchases', () => {
  const mockPurchases = [
    {
      _id: '1',
      product: { _id: 'p1', name: 'Product 1', price: 100, image: 'img1.jpg' },
      buy_count: 1,
      status: 0,
    },
    {
      _id: '2',
      product: { _id: 'p2', name: 'Product 2', price: 200, image: 'img2.jpg' },
      buy_count: 2,
      status: 1,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQueryReturn = { data: { data: { data: [] } } }
    mockUsePurchaseStatusReturn = [0, mockSetStatus]
    mockOrderFilterReturn = {
      filters: { searchQuery: '', dateRange: null, priceRange: null },
      setSearchQuery: vi.fn(),
      setDateRange: vi.fn(),
      setPriceRange: vi.fn(),
      clearAllFilters: mockClearAllFilters,
      activeFilterCount: 0,
      filterPurchases: (purchases: any) => purchases,
    }
  })

  it('should render SEO component', () => {
    render(<HistoryPurchases />)
    expect(screen.getByTestId('seo')).toBeInTheDocument()
  })

  it('should render PurchaseTabBar', () => {
    render(<HistoryPurchases />)
    expect(screen.getByTestId('tab-bar')).toBeInTheDocument()
  })

  it('should render OrderSearchFilter', () => {
    render(<HistoryPurchases />)
    expect(screen.getByTestId('order-search-filter')).toBeInTheDocument()
  })

  it('should render purchases when data is available', () => {
    mockUseQueryReturn = { data: { data: { data: mockPurchases } } }
    render(<HistoryPurchases />)
    expect(screen.getByText('Product 1')).toBeInTheDocument()
    expect(screen.getByText('Product 2')).toBeInTheDocument()
  })

  it('should render empty state when no purchases', () => {
    render(<HistoryPurchases />)
    expect(screen.getByText('history.noOrders')).toBeInTheDocument()
  })

  it('should render filtered empty state when filters are active', () => {
    mockOrderFilterReturn = {
      ...mockOrderFilterReturn,
      filters: { searchQuery: 'test', dateRange: null, priceRange: null },
      activeFilterCount: 1,
      filterPurchases: () => [],
    }
    render(<HistoryPurchases />)
    expect(screen.getByText('history.noMatchingOrders')).toBeInTheDocument()
    expect(screen.getByText('history.adjustFilters')).toBeInTheDocument()
  })

  it('should show clear filters button in filtered empty state', () => {
    mockOrderFilterReturn = {
      ...mockOrderFilterReturn,
      filters: { searchQuery: 'test', dateRange: null, priceRange: null },
      activeFilterCount: 1,
      clearAllFilters: mockClearAllFilters,
      filterPurchases: () => [],
    }
    render(<HistoryPurchases />)
    const clearButton = screen.getByText('history.clearAllFilters')
    fireEvent.click(clearButton)
    expect(mockClearAllFilters).toHaveBeenCalled()
  })

  it('should open review modal when review button is clicked', () => {
    mockUseQueryReturn = { data: { data: { data: mockPurchases } } }
    render(<HistoryPurchases />)
    const reviewButtons = screen.getAllByText('Review')
    fireEvent.click(reviewButtons[0])
    expect(screen.getByTestId('review-modal')).toBeInTheDocument()
  })

  it('should toggle order tracking when track button is clicked', () => {
    mockUseQueryReturn = { data: { data: { data: mockPurchases } } }
    render(<HistoryPurchases />)
    const trackButtons = screen.getAllByText('Track')
    fireEvent.click(trackButtons[0])
  })

  it('should change status when tab is clicked', () => {
    render(<HistoryPurchases />)
    const tabBar = screen.getByTestId('tab-bar')
    fireEvent.click(tabBar)
    expect(mockSetStatus).toHaveBeenCalledWith(1)
  })

  it('should filter purchases based on filter criteria', () => {
    mockUseQueryReturn = { data: { data: { data: mockPurchases } } }
    mockOrderFilterReturn = {
      ...mockOrderFilterReturn,
      filters: { searchQuery: 'Product 1', dateRange: null, priceRange: null },
      activeFilterCount: 1,
      filterPurchases: (purchases: any) =>
        purchases.filter((p: any) => p.product.name.includes('Product 1')),
    }
    render(<HistoryPurchases />)
    expect(screen.getByText('Product 1')).toBeInTheDocument()
    expect(screen.queryByText('Product 2')).not.toBeInTheDocument()
  })

  it('should display total results in search filter', () => {
    mockUseQueryReturn = { data: { data: { data: mockPurchases } } }
    render(<HistoryPurchases />)
    expect(screen.getByText('Results: 2')).toBeInTheDocument()
  })
})
