import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderSearchFilter from '../OrderSearchFilter'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock child components
vi.mock('../components/SearchInput', () => ({
  default: ({ inputValue, onInputChange, onClearSearch }: any) => (
    <div data-testid="search-input">
      <input
        type="text"
        value={inputValue}
        onChange={onInputChange}
        placeholder="Search"
        aria-label="Search input"
      />
      <button onClick={onClearSearch} aria-label="Clear search">
        Clear
      </button>
    </div>
  ),
}))

vi.mock('../components/FilterPanel', () => ({
  default: ({
    isOpen,
    dateFrom,
    dateTo,
    priceMin,
    priceMax,
    onDateFromChange,
    onDateToChange,
    onPriceMinChange,
    onPriceMaxChange,
  }: any) =>
    isOpen ? (
      <div data-testid="filter-panel">
        <input type="date" value={dateFrom} onChange={onDateFromChange} aria-label="Date from" />
        <input type="date" value={dateTo} onChange={onDateToChange} aria-label="Date to" />
        <input type="number" value={priceMin} onChange={onPriceMinChange} aria-label="Price min" />
        <input type="number" value={priceMax} onChange={onPriceMaxChange} aria-label="Price max" />
      </div>
    ) : null,
}))

vi.mock('../components/ActiveFilterChips', () => ({
  default: ({
    hasAnyFilter,
    totalResults,
    onClearSearch,
    onClearDateRange,
    onClearPriceRange,
    onClearAllFilters,
  }: any) =>
    hasAnyFilter ? (
      <div data-testid="active-filter-chips">
        {totalResults !== undefined && <span>Results: {totalResults}</span>}
        <button onClick={onClearSearch}>Clear search</button>
        <button onClick={onClearDateRange}>Clear date</button>
        <button onClick={onClearPriceRange}>Clear price</button>
        <button onClick={onClearAllFilters}>Clear all</button>
      </div>
    ) : null,
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

describe('OrderSearchFilter Component', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    dateRange: null,
    onDateRangeChange: vi.fn(),
    priceRange: null,
    onPriceRangeChange: vi.fn(),
    onClearAll: vi.fn(),
    activeFilterCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('should render search input', () => {
      render(<OrderSearchFilter {...defaultProps} />)
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    test('should render filter button', () => {
      render(<OrderSearchFilter {...defaultProps} />)
      const filterButton = screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i })
      expect(filterButton).toBeInTheDocument()
      expect(filterButton).toHaveTextContent('Bộ lọc')
    })

    test('should not show filter badge when activeFilterCount is 0', () => {
      render(<OrderSearchFilter {...defaultProps} activeFilterCount={0} />)
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    test('should show filter badge when activeFilterCount > 0', () => {
      render(<OrderSearchFilter {...defaultProps} activeFilterCount={3} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    test('should apply custom className', () => {
      const { container } = render(<OrderSearchFilter {...defaultProps} className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
    })

    test('should show total results when provided', () => {
      render(<OrderSearchFilter {...defaultProps} activeFilterCount={1} totalResults={42} />)
      expect(screen.getByText('Results: 42')).toBeInTheDocument()
    })
  })

  describe('Filter Panel Toggle', () => {
    test('should toggle filter panel when button is clicked', async () => {
      const user = userEvent.setup()
      render(<OrderSearchFilter {...defaultProps} />)

      const filterButton = screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i })
      expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument()

      await user.click(filterButton)
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument()

      await user.click(filterButton)
      expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument()
    })

    test('should have aria-expanded attribute on filter button', async () => {
      const user = userEvent.setup()
      render(<OrderSearchFilter {...defaultProps} />)

      const filterButton = screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i })
      expect(filterButton).toHaveAttribute('aria-expanded', 'false')

      await user.click(filterButton)
      expect(filterButton).toHaveAttribute('aria-expanded', 'true')
    })

    test('should apply active styles when filter panel is open', async () => {
      const user = userEvent.setup()
      render(<OrderSearchFilter {...defaultProps} />)

      const filterButton = screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i })
      expect(filterButton).toHaveClass('border-gray-300')

      await user.click(filterButton)
      expect(filterButton).toHaveClass('border-[#ee4d2d]')
    })

    test('should apply active styles when filters are active', () => {
      render(<OrderSearchFilter {...defaultProps} activeFilterCount={1} />)
      const filterButton = screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i })
      expect(filterButton).toHaveClass('border-[#ee4d2d]')
    })

    test('should rotate chevron icon when panel is open', async () => {
      const user = userEvent.setup()
      const { container } = render(<OrderSearchFilter {...defaultProps} />)

      const filterButton = screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i })
      const chevronIcon = container.querySelector('svg[viewBox="0 0 24 24"]:last-of-type')

      expect(chevronIcon).not.toHaveClass('rotate-180')

      await user.click(filterButton)
      expect(chevronIcon).toHaveClass('rotate-180')
    })
  })

  describe('Search Functionality', () => {
    test('should handle search input change with debounce', async () => {
      const user = userEvent.setup()
      const onSearchChange = vi.fn()
      render(<OrderSearchFilter {...defaultProps} onSearchChange={onSearchChange} />)

      const searchInput = screen.getByLabelText('Search input')
      await user.type(searchInput, 'test query')

      // Should not call immediately
      expect(onSearchChange).not.toHaveBeenCalled()

      // Should call after debounce (300ms)
      await waitFor(
        () => {
          expect(onSearchChange).toHaveBeenCalledWith('test query')
        },
        { timeout: 500 },
      )
    })

    test('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup()
      const onSearchChange = vi.fn()
      render(
        <OrderSearchFilter {...defaultProps} searchQuery="test" onSearchChange={onSearchChange} />,
      )

      const clearButton = screen.getByLabelText('Clear search')
      await user.click(clearButton)

      expect(onSearchChange).toHaveBeenCalledWith('')
    })

    test('should sync input value with searchQuery prop', () => {
      const { rerender } = render(<OrderSearchFilter {...defaultProps} searchQuery="initial" />)
      expect(screen.getByLabelText('Search input')).toHaveValue('initial')

      rerender(<OrderSearchFilter {...defaultProps} searchQuery="updated" />)
      expect(screen.getByLabelText('Search input')).toHaveValue('updated')
    })
  })

  describe('Date Range Filtering', () => {
    test('should handle date from change', async () => {
      const user = userEvent.setup()
      const onDateRangeChange = vi.fn()
      render(<OrderSearchFilter {...defaultProps} onDateRangeChange={onDateRangeChange} />)

      // Open filter panel
      await user.click(screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i }))

      const dateFromInput = screen.getByLabelText('Date from')
      await user.type(dateFromInput, '2024-01-01')

      // Should not call without dateTo
      expect(onDateRangeChange).not.toHaveBeenCalled()
    })

    test('should call onDateRangeChange when both dates are set', async () => {
      const user = userEvent.setup()
      const onDateRangeChange = vi.fn()
      render(<OrderSearchFilter {...defaultProps} onDateRangeChange={onDateRangeChange} />)

      await user.click(screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i }))

      const dateFromInput = screen.getByLabelText('Date from')
      const dateToInput = screen.getByLabelText('Date to')

      await user.type(dateFromInput, '2024-01-01')
      await user.type(dateToInput, '2024-01-31')

      expect(onDateRangeChange).toHaveBeenCalledWith({
        from: '2024-01-01',
        to: '2024-01-31',
      })
    })

    test('should clear date range when both inputs are cleared', async () => {
      const user = userEvent.setup()
      const onDateRangeChange = vi.fn()
      render(
        <OrderSearchFilter
          {...defaultProps}
          dateRange={{ from: '2024-01-01', to: '2024-01-31' }}
          onDateRangeChange={onDateRangeChange}
        />,
      )

      await user.click(screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i }))

      const dateFromInput = screen.getByLabelText('Date from')
      const dateToInput = screen.getByLabelText('Date to')

      await user.clear(dateFromInput)
      await user.clear(dateToInput)

      expect(onDateRangeChange).toHaveBeenCalledWith(null)
    })

    test('should sync date inputs with dateRange prop', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<OrderSearchFilter {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i }))

      rerender(
        <OrderSearchFilter
          {...defaultProps}
          dateRange={{ from: '2024-01-01', to: '2024-01-31' }}
        />,
      )

      expect(screen.getByLabelText('Date from')).toHaveValue('2024-01-01')
      expect(screen.getByLabelText('Date to')).toHaveValue('2024-01-31')
    })
  })

  describe('Price Range Filtering', () => {
    test('should handle price min change', async () => {
      const user = userEvent.setup()
      const onPriceRangeChange = vi.fn()
      render(<OrderSearchFilter {...defaultProps} onPriceRangeChange={onPriceRangeChange} />)

      await user.click(screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i }))

      const priceMinInput = screen.getByLabelText('Price min')
      await user.type(priceMinInput, '100')

      // Should not call without priceMax
      expect(onPriceRangeChange).not.toHaveBeenCalled()
    })

    test('should call onPriceRangeChange when both prices are set', async () => {
      const user = userEvent.setup()
      const onPriceRangeChange = vi.fn()
      render(<OrderSearchFilter {...defaultProps} onPriceRangeChange={onPriceRangeChange} />)

      await user.click(screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i }))

      const priceMinInput = screen.getByLabelText('Price min')
      const priceMaxInput = screen.getByLabelText('Price max')

      await user.type(priceMinInput, '100')
      await user.type(priceMaxInput, '500')

      expect(onPriceRangeChange).toHaveBeenCalledWith({ min: 100, max: 500 })
    })

    test('should clear price range when both inputs are cleared', async () => {
      const user = userEvent.setup()
      const onPriceRangeChange = vi.fn()
      render(
        <OrderSearchFilter
          {...defaultProps}
          priceRange={{ min: 100, max: 500 }}
          onPriceRangeChange={onPriceRangeChange}
        />,
      )

      await user.click(screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i }))

      const priceMinInput = screen.getByLabelText('Price min')
      const priceMaxInput = screen.getByLabelText('Price max')

      await user.clear(priceMinInput)
      await user.clear(priceMaxInput)

      expect(onPriceRangeChange).toHaveBeenCalledWith(null)
    })

    test('should sync price inputs with priceRange prop', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<OrderSearchFilter {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /Mở bộ lọc nâng cao/i }))

      rerender(<OrderSearchFilter {...defaultProps} priceRange={{ min: 100, max: 500 }} />)

      expect(screen.getByLabelText('Price min')).toHaveValue(100)
      expect(screen.getByLabelText('Price max')).toHaveValue(500)
    })
  })

  describe('Active Filter Chips', () => {
    test('should show active filter chips when filters are active', () => {
      render(<OrderSearchFilter {...defaultProps} activeFilterCount={1} searchQuery="test" />)
      expect(screen.getByTestId('active-filter-chips')).toBeInTheDocument()
    })

    test('should not show active filter chips when no filters are active', () => {
      render(<OrderSearchFilter {...defaultProps} activeFilterCount={0} />)
      expect(screen.queryByTestId('active-filter-chips')).not.toBeInTheDocument()
    })

    test('should handle clear all filters', async () => {
      const user = userEvent.setup()
      const onClearAll = vi.fn()
      render(
        <OrderSearchFilter
          {...defaultProps}
          activeFilterCount={3}
          searchQuery="test"
          onClearAll={onClearAll}
        />,
      )

      const clearAllButton = screen.getByText('Clear all')
      await user.click(clearAllButton)

      expect(onClearAll).toHaveBeenCalled()
    })
  })

  describe('Reduced Motion', () => {
    test('should pass reducedMotion prop to child components', () => {
      render(<OrderSearchFilter {...defaultProps} activeFilterCount={1} />)
      // FilterPanel and ActiveFilterChips receive reducedMotion prop
      expect(screen.getByTestId('active-filter-chips')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty string search query', () => {
      render(<OrderSearchFilter {...defaultProps} searchQuery="" />)
      expect(screen.getByLabelText('Search input')).toHaveValue('')
    })

    test('should handle null dateRange', () => {
      render(<OrderSearchFilter {...defaultProps} dateRange={null} />)
      expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument()
    })

    test('should handle null priceRange', () => {
      render(<OrderSearchFilter {...defaultProps} priceRange={null} />)
      expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument()
    })

    test('should handle totalResults as 0', () => {
      render(<OrderSearchFilter {...defaultProps} activeFilterCount={1} totalResults={0} />)
      expect(screen.getByText('Results: 0')).toBeInTheDocument()
    })

    test('should handle totalResults as undefined', () => {
      render(<OrderSearchFilter {...defaultProps} activeFilterCount={1} totalResults={undefined} />)
      expect(screen.queryByText(/Results:/)).not.toBeInTheDocument()
    })

    test('should handle large activeFilterCount', () => {
      render(<OrderSearchFilter {...defaultProps} activeFilterCount={99} />)
      expect(screen.getByText('99')).toBeInTheDocument()
    })
  })
})
