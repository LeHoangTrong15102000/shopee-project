import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SortProductList from '../SortProductList'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={typeof to === 'string' ? to : `${to.pathname}?${to.search}`} {...props}>
      {children}
    </a>
  ),
  createSearchParams: (params: any) => new URLSearchParams(params),
}))

let mockQueryStatesReturn: any
const mockSetFilters = vi.fn()

vi.mock('src/hooks/nuqs', () => ({
  useProductQueryStates: () => mockQueryStatesReturn,
}))

vi.mock('src/components/ViewToggle', () => ({
  default: ({ viewMode, onViewChange }: any) => (
    <div data-testid="view-toggle" onClick={() => onViewChange('grid')}>
      {viewMode}
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

describe('SortProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryStatesReturn = [{ page: 1, sort_by: 'view', order: null }, mockSetFilters]
  })

  it('should render sort buttons', () => {
    render(<SortProductList pageSize={10} />)
    expect(screen.getByText('sort.popular')).toBeInTheDocument()
    expect(screen.getByText('sort.latest')).toBeInTheDocument()
    expect(screen.getByText('sort.bestSelling')).toBeInTheDocument()
  })

  it('should render price select', () => {
    render(<SortProductList pageSize={10} />)
    expect(screen.getByLabelText('sort.sortBy')).toBeInTheDocument()
  })

  it('should render page navigation', () => {
    render(<SortProductList pageSize={10} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('/10')).toBeInTheDocument()
  })

  it('should call setFilters when sort button is clicked', () => {
    render(<SortProductList pageSize={10} />)
    const latestButton = screen.getByText('sort.latest')
    fireEvent.click(latestButton)
    expect(mockSetFilters).toHaveBeenCalledWith({ sort_by: 'createdAt', order: null })
  })

  it('should call setFilters when price order is changed', () => {
    render(<SortProductList pageSize={10} />)
    const priceSelect = screen.getByLabelText('sort.sortBy')
    fireEvent.change(priceSelect, { target: { value: 'asc' } })
    expect(mockSetFilters).toHaveBeenCalledWith({ sort_by: 'price', order: 'asc' })
  })

  it('should highlight active sort button', () => {
    mockQueryStatesReturn = [{ page: 1, sort_by: 'view', order: null }, mockSetFilters]
    render(<SortProductList pageSize={10} />)
    const popularButton = screen.getByText('sort.popular')
    expect(popularButton).toHaveClass('bg-orange')
  })

  it('should disable previous button on first page', () => {
    mockQueryStatesReturn = [{ page: 1, sort_by: 'view', order: null }, mockSetFilters]
    const { container } = render(<SortProductList pageSize={10} />)
    const prevButton = container.querySelector('.cursor-not-allowed')
    expect(prevButton).toBeInTheDocument()
  })

  it('should enable previous button when not on first page', () => {
    mockQueryStatesReturn = [{ page: 2, sort_by: 'view', order: null }, mockSetFilters]
    render(<SortProductList pageSize={10} />)
    const prevLinks = screen.getAllByRole('link')
    const prevLink = prevLinks.find((link) => link.getAttribute('href')?.includes('page=1'))
    expect(prevLink).toBeInTheDocument()
  })

  it('should disable next button on last page', () => {
    mockQueryStatesReturn = [{ page: 10, sort_by: 'view', order: null }, mockSetFilters]
    const { container } = render(<SortProductList pageSize={10} />)
    const disabledButtons = container.querySelectorAll('.cursor-not-allowed')
    expect(disabledButtons.length).toBeGreaterThan(0)
  })

  it('should enable next button when not on last page', () => {
    mockQueryStatesReturn = [{ page: 1, sort_by: 'view', order: null }, mockSetFilters]
    render(<SortProductList pageSize={10} />)
    const nextLinks = screen.getAllByRole('link')
    const nextLink = nextLinks.find((link) => link.getAttribute('href')?.includes('page=2'))
    expect(nextLink).toBeInTheDocument()
  })

  it('should render ViewToggle when viewMode and onViewChange are provided', () => {
    const onViewChange = vi.fn()
    render(<SortProductList pageSize={10} viewMode="grid" onViewChange={onViewChange} />)
    expect(screen.getByTestId('view-toggle')).toBeInTheDocument()
  })

  it('should not render ViewToggle when viewMode is not provided', () => {
    render(<SortProductList pageSize={10} />)
    expect(screen.queryByTestId('view-toggle')).not.toBeInTheDocument()
  })

  it('should highlight price select when price sort is active', () => {
    mockQueryStatesReturn = [{ page: 1, sort_by: 'price', order: 'asc' }, mockSetFilters]
    render(<SortProductList pageSize={10} />)
    const priceSelect = screen.getByLabelText('sort.sortBy')
    expect(priceSelect).toHaveClass('text-orange')
  })

  it('should render price options', () => {
    render(<SortProductList pageSize={10} />)
    expect(screen.getByText('sort.priceLowToHigh')).toBeInTheDocument()
    expect(screen.getByText('sort.priceHighToLow')).toBeInTheDocument()
  })
})
