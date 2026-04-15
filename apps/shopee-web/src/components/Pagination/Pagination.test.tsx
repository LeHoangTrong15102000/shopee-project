import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import Pagination from './Pagination'

const renderWithUrl = (searchParams: string = '', pageSize?: number, basePath?: string) => {
  window.history.pushState({}, '', `/${searchParams ? `?${searchParams}` : ''}`)
  return render(
    <BrowserRouter>
      <NuqsTestingAdapter searchParams={searchParams}>
        <Pagination pageSize={pageSize} basePath={basePath} />
      </NuqsTestingAdapter>
    </BrowserRouter>,
  )
}

describe('Pagination Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.pushState({}, '', '/')
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    test('should render with basic structure', () => {
      renderWithUrl('', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    test('should render page numbers correctly', () => {
      renderWithUrl('page=3', 20)

      const currentPage = screen.getByText('3')
      expect(currentPage).toBeInTheDocument()
    })

    test('should render with custom page size', () => {
      renderWithUrl('', 50)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    test('should render navigation controls', () => {
      renderWithUrl('page=5', 20)

      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    test('should render with different page sizes', () => {
      const { unmount } = renderWithUrl('', 3)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.queryByText('4')).not.toBeInTheDocument()

      unmount()
      renderWithUrl('', 10)

      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })

  describe('Navigation Controls', () => {
    test('should disable previous button on first page', () => {
      renderWithUrl('page=1', 20)

      const prevButton = document.querySelector('.cursor-not-allowed')
      expect(prevButton).toBeInTheDocument()
    })

    test('should render previous button when not on first page', () => {
      renderWithUrl('page=3', 20)

      const prevButton = screen.getByLabelText('Đi đến trang trước')
      expect(prevButton).toBeInTheDocument()
    })

    test('should render next button when not on last page', () => {
      renderWithUrl('page=1', 20)

      const nextButton = screen.getByLabelText('Đi đến trang sau')
      expect(nextButton).toBeInTheDocument()
    })

    test('should disable next button on last page', () => {
      renderWithUrl('page=20', 20)

      const nextButton = document.querySelector('span[class*="cursor-not-allowed"]')
      expect(nextButton).toBeInTheDocument()
    })
  })

  describe('Page URL Generation', () => {
    test('should generate correct URLs for page numbers', () => {
      renderWithUrl('', 20)

      const page2Link = screen.getByText('2').closest('a')
      const href = page2Link?.getAttribute('href') || ''
      expect(href).toContain('page=2')
      expect(href).toContain('limit=20')
      expect(href).toContain('sort_by=createdAt')
    })

    test('should preserve query parameters in URLs', () => {
      renderWithUrl('category=electronics&price_min=100', 20)

      const page2Link = screen.getByText('2').closest('a')
      expect(page2Link?.getAttribute('href')).toContain('category=electronics')
      expect(page2Link?.getAttribute('href')).toContain('price_min=100')
    })

    test('should handle complex query configurations', () => {
      renderWithUrl('page=5&category=books&sort_by=price&order=asc', 20)

      const page6Link = screen.getByText('6').closest('a')
      expect(page6Link?.getAttribute('href')).toContain('page=6')
      expect(page6Link?.getAttribute('href')).toContain('category=books')
      expect(page6Link?.getAttribute('href')).toContain('sort_by=price')
    })
  })

  describe('Dots Rendering Logic', () => {
    test('should render dots for many pages', () => {
      renderWithUrl('page=10', 50)

      const dots = document.querySelectorAll('span:not([class*="cursor-not-allowed"])')
      const dotsWithEllipsis = Array.from(dots).filter((span) => span.textContent?.includes('...'))
      expect(dotsWithEllipsis.length).toBeGreaterThan(0)
    })

    test('should render dots when near start of pages', () => {
      renderWithUrl('page=2', 20)

      const dots = document.querySelectorAll('span[aria-hidden="true"]')
      const dotsWithEllipsis = Array.from(dots).filter((span) => span.textContent?.includes('...'))
      expect(dotsWithEllipsis.length).toBeGreaterThan(0)
    })

    test('should render appropriate number of links for large pagination', () => {
      renderWithUrl('page=15', 50)

      const links = screen.getAllByRole('link')
      expect(links.length).toBeLessThan(20)
    })
  })

  describe('User Interactions', () => {
    test('should provide clickable page links', () => {
      renderWithUrl('', 20)

      const page2Link = screen.getByText('2')
      expect(page2Link.closest('a')).toHaveAttribute('href')
    })

    test('should provide clickable navigation controls', () => {
      renderWithUrl('page=5', 20)

      const prevButton = screen.getByLabelText('Đi đến trang trước')
      const nextButton = screen.getByLabelText('Đi đến trang sau')

      expect(prevButton).toHaveAttribute('href')
      expect(nextButton).toHaveAttribute('href')
    })

    test('should render focusable link elements for keyboard navigation', () => {
      renderWithUrl('', 20)

      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link.tagName).toBe('A')
        expect(link).toHaveAttribute('href')
      })
    })
  })

  describe('Edge Cases', () => {
    test('should handle no URL params gracefully', () => {
      renderWithUrl('', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    test('should handle invalid page numbers', () => {
      renderWithUrl('page=invalid', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    test('should handle zero or negative page numbers', () => {
      renderWithUrl('page=0', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    test('should handle very large page numbers by clamping to last page', () => {
      renderWithUrl('page=9999', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
      const page20 = screen.getByText('20')
      expect(page20).toHaveAttribute('aria-current', 'page')
    })

    test('should handle missing pageSize', () => {
      renderWithUrl('page=1')

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    test('should return null for zero pageSize', () => {
      const { container } = renderWithUrl('page=1', 0)

      expect(container.querySelector('nav')).toBeNull()
    })

    test('should return null for pageSize of 1', () => {
      const { container } = renderWithUrl('page=1', 1)

      expect(container.querySelector('nav')).toBeNull()
    })
  })

  describe('Styling', () => {
    test('should apply correct CSS classes to pagination container', () => {
      renderWithUrl('', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toHaveClass('mt-6', 'flex', 'justify-center')
    })

    test('should highlight current page with active styling', () => {
      renderWithUrl('page=3', 20)

      const currentPage = screen.getByText('3')
      expect(currentPage).toBeInTheDocument()
      expect(currentPage.className).toContain('bg-orange')
      expect(currentPage.className).toContain('text-white')
    })

    test('should style disabled prev button on first page', () => {
      renderWithUrl('page=1', 20)

      const disabledPrev = document.querySelector('.cursor-not-allowed')
      expect(disabledPrev).toBeInTheDocument()
      expect(disabledPrev?.className).toContain('opacity-40')
    })

    test('should apply hover states to clickable elements', () => {
      renderWithUrl('page=2', 20)

      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        const className = link.className
        const hasHoverStyles =
          className.includes('hover:text-[#ee4e2d]') ||
          className.includes('hover:bg-[#ee4d2d]') ||
          className.includes('cursor-pointer')
        expect(hasHoverStyles).toBe(true)
      })
    })
  })

  describe('Accessibility', () => {
    test('should have proper navigation role', () => {
      renderWithUrl('', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toHaveAttribute('role', 'navigation')
    })

    test('should have proper aria-label for navigation', () => {
      renderWithUrl('', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toHaveAttribute('aria-label', 'Điều hướng phân trang')
    })

    test('should provide accessible labels for navigation controls', () => {
      renderWithUrl('page=5', 20)

      expect(screen.getByLabelText('Đi đến trang trước')).toBeInTheDocument()
      expect(screen.getByLabelText('Đi đến trang sau')).toBeInTheDocument()
    })

    test('should support screen readers', () => {
      renderWithUrl('', 20)

      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link.tagName).toBe('A')
        expect(link).toHaveAttribute('href')
      })
    })
  })

  describe('Performance', () => {
    test('should survive re-render without error', () => {
      const { rerender } = renderWithUrl('', 20)

      rerender(
        <BrowserRouter>
          <NuqsTestingAdapter>
            <Pagination pageSize={20} />
          </NuqsTestingAdapter>
        </BrowserRouter>,
      )

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    test('should handle large page counts efficiently', () => {
      renderWithUrl('page=500', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })
  })

  describe('Props Validation', () => {
    test('should handle no URL params gracefully', () => {
      expect(() => {
        renderWithUrl('', 20)
      }).not.toThrow()
    })

    test('should use reasonable defaults', () => {
      renderWithUrl('')

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })
  })
})

const renderControlled = (
  currentPage: number,
  totalPages: number,
  onPageChange?: (page: number) => void,
) => {
  return render(
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange || vi.fn()}
    />,
  )
}

describe('Pagination Controlled Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    test('should render with controlled props', () => {
      renderControlled(1, 20)
      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    test('should render buttons instead of links', () => {
      renderControlled(5, 20)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      expect(screen.queryAllByRole('link')).toHaveLength(0)
    })

    test('should return null for totalPages <= 1', () => {
      const { container } = renderControlled(1, 1)
      expect(container.querySelector('nav')).toBeNull()
    })

    test('should return null for totalPages = 0', () => {
      const { container } = renderControlled(1, 0)
      expect(container.querySelector('nav')).toBeNull()
    })
  })

  describe('Page Change Callback', () => {
    test('should call onPageChange when clicking a page button', () => {
      const onPageChange = vi.fn()
      renderControlled(1, 20, onPageChange)

      fireEvent.click(screen.getByText('2'))
      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    test('should call onPageChange with correct page for next button', () => {
      const onPageChange = vi.fn()
      renderControlled(5, 20, onPageChange)

      const nextButton = screen.getByLabelText('Đi đến trang sau')
      fireEvent.click(nextButton)
      expect(onPageChange).toHaveBeenCalledWith(6)
    })

    test('should call onPageChange with correct page for prev button', () => {
      const onPageChange = vi.fn()
      renderControlled(5, 20, onPageChange)

      const prevButton = screen.getByLabelText('Đi đến trang trước')
      fireEvent.click(prevButton)
      expect(onPageChange).toHaveBeenCalledWith(4)
    })
  })

  describe('Disabled States', () => {
    test('should disable prev button on first page with correct styling', () => {
      renderControlled(1, 20)
      const disabledPrev = document.querySelector('span[aria-disabled="true"]')
      expect(disabledPrev).toBeInTheDocument()
      expect(disabledPrev?.className).toContain('cursor-not-allowed')
      expect(disabledPrev?.className).toContain('opacity-40')
    })

    test('should disable next button on last page with correct styling', () => {
      renderControlled(20, 20)
      const disabledSpans = document.querySelectorAll('span[aria-disabled="true"]')
      expect(disabledSpans.length).toBeGreaterThan(0)
      const lastDisabled = disabledSpans[disabledSpans.length - 1]
      expect(lastDisabled?.className).toContain('cursor-not-allowed')
      expect(lastDisabled?.className).toContain('opacity-40')
    })

    test('should enable both prev and next on middle page', () => {
      renderControlled(10, 20)
      const prevButton = screen.getByLabelText('Đi đến trang trước')
      const nextButton = screen.getByLabelText('Đi đến trang sau')
      expect(prevButton.tagName).toBe('BUTTON')
      expect(nextButton.tagName).toBe('BUTTON')
    })

    test('should not trigger onPageChange when clicking disabled prev span', () => {
      const onPageChange = vi.fn()
      renderControlled(1, 20, onPageChange)
      const disabledPrev = document.querySelector('span[aria-disabled="true"]')
      if (disabledPrev) fireEvent.click(disabledPrev)
      expect(onPageChange).not.toHaveBeenCalled()
    })

    test('should not trigger onPageChange when clicking disabled next span', () => {
      const onPageChange = vi.fn()
      renderControlled(20, 20, onPageChange)
      const disabledSpans = document.querySelectorAll('span[aria-disabled="true"]')
      const disabledNext = disabledSpans[disabledSpans.length - 1]
      if (disabledNext) fireEvent.click(disabledNext)
      expect(onPageChange).not.toHaveBeenCalled()
    })
  })

  describe('RANGE 2 Algorithm', () => {
    test('should render correct page sequence for page 5 of 20', () => {
      renderControlled(5, 20)
      const buttons = screen.getAllByRole('button')
      const pageTexts = buttons.map((b) => b.textContent).filter((t) => t && /^\d+$/.test(t))
      expect(pageTexts).toEqual(['1', '2', '3', '4', '5', '6', '7', '19', '20'])
    })

    test('should render dots for large page counts with correct styling', () => {
      renderControlled(10, 20)
      const dots = document.querySelectorAll('span[aria-hidden="true"]')
      const dotsWithEllipsis = Array.from(dots).filter((span) => span.textContent === '...')
      expect(dotsWithEllipsis.length).toBeGreaterThan(0)
      dotsWithEllipsis.forEach((dot) => {
        expect(dot.className).toContain('border-gray-200')
        expect(dot.className).toContain('bg-white')
        expect(dot.className).toContain('shadow-xs')
      })
    })

    test('should render all pages for small page counts', () => {
      renderControlled(1, 3)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper navigation role and aria-label', () => {
      renderControlled(1, 20)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Điều hướng phân trang')
    })

    test('should mark current page with aria-current', () => {
      renderControlled(5, 20)
      const currentPageButton = screen.getByText('5')
      expect(currentPageButton).toHaveAttribute('aria-current', 'page')
    })

    test('should have aria-labels on page buttons', () => {
      renderControlled(5, 20)
      const page3Button = screen.getByText('3')
      expect(page3Button).toHaveAttribute('aria-label')
    })

    test('should trigger onPageChange on keyboard Enter via click', () => {
      const onPageChange = vi.fn()
      renderControlled(5, 20, onPageChange)
      const page3 = screen.getByText('3')
      fireEvent.click(page3)
      expect(onPageChange).toHaveBeenCalledWith(3)
    })
  })

  describe('Edge Cases', () => {
    test('should call onPageChange when clicking already-active page', () => {
      const onPageChange = vi.fn()
      renderControlled(5, 20, onPageChange)
      const activePage = screen.getByText('5')
      fireEvent.click(activePage)
      expect(onPageChange).toHaveBeenCalledWith(5)
    })

    test('should clamp currentPage=0 and render as page 1', () => {
      renderControlled(0, 20)
      const page1 = screen.getByText('1')
      expect(page1).toHaveAttribute('aria-current', 'page')
      expect(page1.className).toContain('bg-orange')
    })

    test('should return null for negative totalPages', () => {
      const { container } = renderControlled(1, -5)
      expect(container.querySelector('nav')).toBeNull()
    })
  })

  describe('Styling', () => {
    test('should apply active styling to current page', () => {
      renderControlled(5, 20)
      const currentPage = screen.getByText('5')
      expect(currentPage.className).toContain('bg-orange')
      expect(currentPage.className).toContain('text-white')
    })
  })
})
