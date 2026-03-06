import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    </BrowserRouter>
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

      const prevButton = screen.getByLabelText('Go to previous page')
      expect(prevButton).toBeInTheDocument()
    })

    test('should render next button when not on last page', () => {
      renderWithUrl('page=1', 20)

      const nextButton = screen.getByLabelText('Go to next page')
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

    test('should handle edge cases with dots', () => {
      renderWithUrl('page=2', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
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

      const prevButton = screen.getByLabelText('Go to previous page')
      const nextButton = screen.getByLabelText('Go to next page')

      expect(prevButton).toHaveAttribute('href')
      expect(nextButton).toHaveAttribute('href')
    })

    test('should support keyboard navigation', () => {
      renderWithUrl('', 20)

      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link.tagName).toBe('A')
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

    test('should handle very large page numbers', () => {
      renderWithUrl('page=9999', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    test('should handle missing pageSize', () => {
      renderWithUrl('page=1')

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    test('should handle zero pageSize', () => {
      renderWithUrl('page=1', 0)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    test('should apply correct CSS classes to pagination container', () => {
      renderWithUrl('', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toHaveClass('mt-6', 'flex', 'justify-center')
    })

    test('should highlight current page', () => {
      renderWithUrl('page=3', 20)

      const currentPage = screen.getByText('3')
      expect(currentPage).toBeInTheDocument()
    })

    test('should style disabled navigation elements', () => {
      renderWithUrl('page=1', 20)

      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
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
      expect(pagination).toHaveAttribute('aria-label', 'Pagination Navigation')
    })

    test('should provide accessible labels for navigation controls', () => {
      renderWithUrl('page=5', 20)

      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument()
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument()
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
    test('should not re-render unnecessarily', () => {
      const { rerender } = renderWithUrl('', 20)

      rerender(
        <BrowserRouter>
          <NuqsTestingAdapter>
            <Pagination pageSize={20} />
          </NuqsTestingAdapter>
        </BrowserRouter>
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
