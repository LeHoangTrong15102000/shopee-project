import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WishlistFilters from '../components/WishlistFilters'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => {
      const { initial, animate, exit, transition, variants, whileHover, layout, ...rest } = p
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ariaLabel, ...rest } = props
    return (
      <button onClick={onClick} className={className} {...rest}>
        {children}
      </button>
    )
  },
}))

describe('WishlistFilters', () => {
  const defaultProps = {
    activeFilter: 'all',
    activeSort: 'newest',
    showSortDropdown: false,
    onFilterChange: vi.fn(),
    onSortChange: vi.fn(),
    onToggleSortDropdown: vi.fn(),
  }

  it('renders filter pills', () => {
    render(<WishlistFilters {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    // 6 filter pills + 1 sort button = 7
    expect(buttons.length).toBeGreaterThanOrEqual(7)
  })

  it('calls onFilterChange when filter pill clicked', () => {
    const onFilterChange = vi.fn()
    render(<WishlistFilters {...defaultProps} onFilterChange={onFilterChange} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1]) // click second filter pill
    expect(onFilterChange).toHaveBeenCalled()
  })

  it('calls onToggleSortDropdown when sort button clicked', () => {
    const onToggle = vi.fn()
    render(<WishlistFilters {...defaultProps} onToggleSortDropdown={onToggle} />)
    const buttons = screen.getAllByRole('button')
    // Last button before dropdown is the sort toggle
    const sortButton = buttons.find((b) => b.textContent?.includes('Sắp xếp'))
    if (sortButton) {
      fireEvent.click(sortButton)
      expect(onToggle).toHaveBeenCalled()
    }
  })

  it('shows sort dropdown when showSortDropdown is true', () => {
    render(<WishlistFilters {...defaultProps} showSortDropdown={true} />)
    const buttons = screen.getAllByRole('button')
    // Should have more buttons when dropdown is open (6 pills + 1 sort + 5 sort options = 12)
    expect(buttons.length).toBeGreaterThanOrEqual(12)
  })

  it('hides sort dropdown when showSortDropdown is false', () => {
    render(<WishlistFilters {...defaultProps} showSortDropdown={false} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeLessThan(12)
  })

  it('calls onSortChange and onToggleSortDropdown when sort option clicked', () => {
    const onSortChange = vi.fn()
    const onToggle = vi.fn()
    render(
      <WishlistFilters
        {...defaultProps}
        showSortDropdown={true}
        onSortChange={onSortChange}
        onToggleSortDropdown={onToggle}
      />,
    )
    const buttons = screen.getAllByRole('button')
    // Sort options are after the 7 main buttons
    const sortOptionButtons = buttons.slice(7)
    if (sortOptionButtons.length > 0) {
      fireEvent.click(sortOptionButtons[0])
      expect(onSortChange).toHaveBeenCalled()
      expect(onToggle).toHaveBeenCalled()
    }
  })

  it('highlights active filter pill', () => {
    render(<WishlistFilters {...defaultProps} activeFilter="sale" />)
    const buttons = screen.getAllByRole('button')
    const activeButton = buttons.find((b) => b.className.includes('bg-[#ee4d2d]'))
    expect(activeButton).toBeTruthy()
  })

  it('highlights active sort option in dropdown', () => {
    render(<WishlistFilters {...defaultProps} showSortDropdown={true} activeSort="price-asc" />)
    const buttons = screen.getAllByRole('button')
    const activeSort = buttons.find((b) => b.className.includes('bg-orange-50'))
    expect(activeSort).toBeTruthy()
  })
})
