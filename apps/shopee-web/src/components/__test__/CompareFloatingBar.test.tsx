import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CompareFloatingBar from '../CompareFloatingBar/CompareFloatingBar'
import type { Product } from 'src/types/product.type'

// Mock react-router
vi.mock('react-router', () => ({
  Link: ({ to, children, className, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        tableAriaLabel: 'Product comparison',
        comparing: `Comparing ${options?.count || 0} products`,
        removeAriaLabel: `Remove ${options?.name || 'product'}`,
        addProduct: 'Add product',
        clearAll: 'Clear all',
        clearAllAriaLabel: 'Clear all products',
        compareNow: `Compare ${options?.count || 0} products`,
        compareAriaLabel: `Compare ${options?.count || 0} products`,
      }
      return translations[key] || key
    },
  }),
}))

// Mock Button component
vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

// Mock useProductComparison hook
const mockRemoveFromCompare = vi.fn()
const mockClearCompare = vi.fn()
let mockCompareList: Product[] = []

vi.mock('src/hooks/useProductComparison', () => ({
  useProductComparison: () => ({
    compareList: mockCompareList,
    removeFromCompare: mockRemoveFromCompare,
    clearCompare: mockClearCompare,
  }),
}))

describe('CompareFloatingBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCompareList = []
  })

  describe('1. Returns null when compareList is empty', () => {
    it('should not render when compareList is empty', () => {
      mockCompareList = []
      const { container } = render(<CompareFloatingBar />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('2. Renders when compareList has items', () => {
    it('should render the floating bar when compareList has items', () => {
      mockCompareList = [
        {
          _id: '1',
          name: 'Product 1',
          image: 'https://example.com/product1.jpg',
        } as Product,
      ]
      render(<CompareFloatingBar />)
      expect(screen.getByRole('region', { name: 'Product comparison' })).toBeInTheDocument()
    })
  })

  describe('3. Shows product names in the bar', () => {
    it('should display product names in tooltips', () => {
      mockCompareList = [
        {
          _id: '1',
          name: 'Product 1',
          image: 'https://example.com/product1.jpg',
        } as Product,
        {
          _id: '2',
          name: 'Product 2',
          image: 'https://example.com/product2.jpg',
        } as Product,
      ]
      render(<CompareFloatingBar />)

      const tooltips = screen.getAllByRole('tooltip', { hidden: true })
      expect(tooltips[0]).toHaveTextContent('Product 1')
      expect(tooltips[1]).toHaveTextContent('Product 2')
    })

    it('should display product images with alt text', () => {
      mockCompareList = [
        {
          _id: '1',
          name: 'Product 1',
          image: 'https://example.com/product1.jpg',
        } as Product,
      ]
      render(<CompareFloatingBar />)

      const image = screen.getByAltText('Product 1')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/product1.jpg')
    })
  })

  describe('4. Truncates long product names (>30 chars)', () => {
    it('should truncate product names longer than 30 characters in tooltip', () => {
      const longName = 'This is a very long product name that exceeds thirty characters'
      mockCompareList = [
        {
          _id: '1',
          name: longName,
          image: 'https://example.com/product1.jpg',
        } as Product,
      ]
      render(<CompareFloatingBar />)

      const tooltip = screen.getByRole('tooltip', { hidden: true })
      expect(tooltip).toHaveTextContent('This is a very long product na...')
      expect(tooltip).not.toHaveTextContent(longName)
    })

    it('should not truncate product names with exactly 30 characters', () => {
      const exactName = 'Product name with 30 chars!!'
      mockCompareList = [
        {
          _id: '1',
          name: exactName,
          image: 'https://example.com/product1.jpg',
        } as Product,
      ]
      render(<CompareFloatingBar />)

      const tooltip = screen.getByRole('tooltip', { hidden: true })
      expect(tooltip).toHaveTextContent(exactName)
    })

    it('should not truncate product names shorter than 30 characters', () => {
      mockCompareList = [
        {
          _id: '1',
          name: 'Short name',
          image: 'https://example.com/product1.jpg',
        } as Product,
      ]
      render(<CompareFloatingBar />)

      const tooltip = screen.getByRole('tooltip', { hidden: true })
      expect(tooltip).toHaveTextContent('Short name')
    })
  })

  describe('5. Toggle expand/collapse', () => {
    it('should toggle expanded state when toggle button is clicked', () => {
      mockCompareList = [
        {
          _id: '1',
          name: 'Product 1',
          image: 'https://example.com/product1.jpg',
        } as Product,
      ]
      const { container } = render(<CompareFloatingBar />)

      const toggleButton = screen.getByRole('button', { name: /Product comparison/i })
      const floatingBar = container.querySelector('[role="region"]')

      // Initially expanded
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      expect(floatingBar).not.toHaveClass('translate-y-[calc(100%-48px)]')

      // Click to collapse
      fireEvent.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
      expect(floatingBar).toHaveClass('translate-y-[calc(100%-48px)]')

      // Click to expand again
      fireEvent.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      expect(floatingBar).not.toHaveClass('translate-y-[calc(100%-48px)]')
    })

    it('should rotate chevron icon when toggling', () => {
      mockCompareList = [
        {
          _id: '1',
          name: 'Product 1',
          image: 'https://example.com/product1.jpg',
        } as Product,
      ]
      const { container } = render(<CompareFloatingBar />)

      const toggleButton = screen.getByRole('button', { name: /Product comparison/i })
      const chevron = container.querySelector('svg.rotate-180')

      // Initially expanded (chevron rotated)
      expect(chevron).toBeInTheDocument()

      // Click to collapse
      fireEvent.click(toggleButton)
      expect(container.querySelector('svg.rotate-180')).not.toBeInTheDocument()
    })
  })

  describe('6. Disables compare button when less than 2 items', () => {
    it('should disable compare button with 0 items', () => {
      mockCompareList = []
      const { container } = render(<CompareFloatingBar />)
      expect(container.firstChild).toBeNull()
    })

    it('should disable compare button with 1 item', () => {
      mockCompareList = [
        {
          _id: '1',
          name: 'Product 1',
          image: 'https://example.com/product1.jpg',
        } as Product,
      ]
      render(<CompareFloatingBar />)

      const compareLink = screen.getByRole('link', { name: /Compare 1 products/i })
      expect(compareLink).toHaveClass('pointer-events-none', 'opacity-50')
      expect(compareLink).toHaveAttribute('aria-disabled', 'true')
      expect(compareLink).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('7. Enables compare button when 2+ items', () => {
    it('should enable compare button with 2 items', () => {
      mockCompareList = [
        {
          _id: '1',
          name: 'Product 1',
          image: 'https://example.com/product1.jpg',
        } as Product,
        {
          _id: '2',
          name: 'Product 2',
          image: 'https://example.com/product2.jpg',
        } as Product,
      ]
      render(<CompareFloatingBar />)

      const compareLink = screen.getByRole('link', { name: /Compare 2 products/i })
      expect(compareLink).not.toHaveClass('pointer-events-none')
      expect(compareLink).not.toHaveClass('opacity-50')
      expect(compareLink).toHaveAttribute('aria-disabled', 'false')
      expect(compareLink).not.toHaveAttribute('tabIndex', '-1')
    })

    it('should enable compare button with 4 items', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
        { _id: '2', name: 'Product 2', image: 'https://example.com/2.jpg' } as Product,
        { _id: '3', name: 'Product 3', image: 'https://example.com/3.jpg' } as Product,
        { _id: '4', name: 'Product 4', image: 'https://example.com/4.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const compareLink = screen.getByRole('link', { name: /Compare 4 products/i })
      expect(compareLink).not.toHaveClass('pointer-events-none')
      expect(compareLink).not.toHaveClass('opacity-50')
    })

    it('should link to correct compare path', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
        { _id: '2', name: 'Product 2', image: 'https://example.com/2.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const compareLink = screen.getByRole('link', { name: /Compare 2 products/i })
      expect(compareLink).toHaveAttribute('href', '/compare')
    })
  })

  describe('8. Remove product from comparison', () => {
    it('should call removeFromCompare when remove button is clicked', () => {
      mockCompareList = [
        {
          _id: '1',
          name: 'Product 1',
          image: 'https://example.com/product1.jpg',
        } as Product,
      ]
      render(<CompareFloatingBar />)

      const removeButton = screen.getByRole('button', { name: /Remove Product 1/i })
      fireEvent.click(removeButton)

      expect(mockRemoveFromCompare).toHaveBeenCalledWith('1')
      expect(mockRemoveFromCompare).toHaveBeenCalledTimes(1)
    })

    it('should call removeFromCompare with correct product ID for multiple products', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
        { _id: '2', name: 'Product 2', image: 'https://example.com/2.jpg' } as Product,
        { _id: '3', name: 'Product 3', image: 'https://example.com/3.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const removeButton2 = screen.getByRole('button', { name: /Remove Product 2/i })
      fireEvent.click(removeButton2)

      expect(mockRemoveFromCompare).toHaveBeenCalledWith('2')
      expect(mockRemoveFromCompare).toHaveBeenCalledTimes(1)
    })
  })

  describe('9. Clear all products', () => {
    it('should call clearCompare when clear all button is clicked', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
        { _id: '2', name: 'Product 2', image: 'https://example.com/2.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const clearButton = screen.getByRole('button', { name: /Clear all products/i })
      fireEvent.click(clearButton)

      expect(mockClearCompare).toHaveBeenCalledTimes(1)
    })

    it('should display clear all button text', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const clearButton = screen.getByRole('button', { name: /Clear all products/i })
      expect(clearButton).toHaveTextContent('Clear all')
    })
  })

  describe('10. Shows empty slots for remaining capacity', () => {
    it('should show 3 empty slots when 1 product is in comparison', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const emptySlots = screen.getAllByLabelText('Add product')
      expect(emptySlots).toHaveLength(3)
    })

    it('should show 2 empty slots when 2 products are in comparison', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
        { _id: '2', name: 'Product 2', image: 'https://example.com/2.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const emptySlots = screen.getAllByLabelText('Add product')
      expect(emptySlots).toHaveLength(2)
    })

    it('should show 1 empty slot when 3 products are in comparison', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
        { _id: '2', name: 'Product 2', image: 'https://example.com/2.jpg' } as Product,
        { _id: '3', name: 'Product 3', image: 'https://example.com/3.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const emptySlots = screen.getAllByLabelText('Add product')
      expect(emptySlots).toHaveLength(1)
    })

    it('should show 0 empty slots when 4 products are in comparison', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
        { _id: '2', name: 'Product 2', image: 'https://example.com/2.jpg' } as Product,
        { _id: '3', name: 'Product 3', image: 'https://example.com/3.jpg' } as Product,
        { _id: '4', name: 'Product 4', image: 'https://example.com/4.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const emptySlots = screen.queryAllByLabelText('Add product')
      expect(emptySlots).toHaveLength(0)
    })

    it('should render empty slots with dashed border styling', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
      ]
      const { container } = render(<CompareFloatingBar />)

      const emptySlots = container.querySelectorAll('.border-dashed')
      expect(emptySlots.length).toBeGreaterThan(0)
    })
  })

  describe('11. className prop passthrough', () => {
    it('should apply custom className to the floating bar', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
      ]
      render(<CompareFloatingBar className="custom-class" />)

      const floatingBar = screen.getByRole('region', { name: 'Product comparison' })
      expect(floatingBar).toHaveClass('custom-class')
    })

    it('should preserve default classes when custom className is added', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
      ]
      render(<CompareFloatingBar className="custom-class" />)

      const floatingBar = screen.getByRole('region', { name: 'Product comparison' })
      expect(floatingBar).toHaveClass('fixed', 'right-0', 'bottom-0', 'left-0', 'z-50')
      expect(floatingBar).toHaveClass('custom-class')
    })

    it('should work without className prop', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const floatingBar = screen.getByRole('region', { name: 'Product comparison' })
      expect(floatingBar).toHaveClass('fixed', 'right-0', 'bottom-0', 'left-0', 'z-50')
    })
  })

  describe('Additional functionality', () => {
    it('should use custom comparePath prop', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
        { _id: '2', name: 'Product 2', image: 'https://example.com/2.jpg' } as Product,
      ]
      render(<CompareFloatingBar comparePath="/custom-compare" />)

      const compareLink = screen.getByRole('link', { name: /Compare 2 products/i })
      expect(compareLink).toHaveAttribute('href', '/custom-compare')
    })

    it('should display correct count in toggle button', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
        { _id: '2', name: 'Product 2', image: 'https://example.com/2.jpg' } as Product,
        { _id: '3', name: 'Product 3', image: 'https://example.com/3.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      const toggleButton = screen.getByRole('button', { name: /Product comparison/i })
      expect(toggleButton).toHaveTextContent('Comparing 3 products')
    })

    it('should render all products in list', () => {
      mockCompareList = [
        { _id: '1', name: 'Product 1', image: 'https://example.com/1.jpg' } as Product,
        { _id: '2', name: 'Product 2', image: 'https://example.com/2.jpg' } as Product,
      ]
      render(<CompareFloatingBar />)

      expect(screen.getByAltText('Product 1')).toBeInTheDocument()
      expect(screen.getByAltText('Product 2')).toBeInTheDocument()
    })
  })
})
