import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import ProductRating from './ProductRating'

describe('ProductRating Component Unit Tests', () => {
  describe('Rendering', () => {
    test('should render 5 stars', () => {
      const { container } = render(<ProductRating rating={3} />)

      const stars = container.querySelectorAll('svg')
      expect(stars).toHaveLength(10) // 5 stars × 2 SVGs each (active + inactive)
    })

    test('should render with default classes when not provided', () => {
      const { container } = render(<ProductRating rating={3} />)

      const activeStars = container.querySelectorAll('.fill-orange')
      const inactiveStars = container.querySelectorAll('.text-gray-300')

      expect(activeStars.length).toBeGreaterThan(0)
      expect(inactiveStars.length).toBeGreaterThan(0)
    })

    test('should render with custom classes when provided', () => {
      const { container } = render(
        <ProductRating
          rating={3}
          activeClassname='custom-active h-4 w-4'
          nonActiveClassname='custom-inactive h-4 w-4'
        />
      )

      const customActiveStars = container.querySelectorAll('.custom-active')
      const customInactiveStars = container.querySelectorAll('.custom-inactive')

      expect(customActiveStars.length).toBeGreaterThan(0)
      expect(customInactiveStars.length).toBeGreaterThan(0)
    })
  })

  describe('Rating Calculations', () => {
    test('should handle full star ratings correctly', () => {
      const { container } = render(<ProductRating rating={3.0} />)

      const starContainers = container.querySelectorAll('.relative')

      // First 3 stars should be 100% filled
      for (let i = 0; i < 3; i++) {
        const fillElement = starContainers[i].querySelector('.absolute') as HTMLElement
        expect(fillElement.style.width).toBe('100%')
      }

      // Remaining 2 stars should be 0% filled
      for (let i = 3; i < 5; i++) {
        const fillElement = starContainers[i].querySelector('.absolute') as HTMLElement
        expect(fillElement.style.width).toBe('0%')
      }
    })

    test('should handle partial star ratings correctly', () => {
      const { container } = render(<ProductRating rating={3.5} />)

      const starContainers = container.querySelectorAll('.relative')

      // First 3 stars should be 100% filled
      for (let i = 0; i < 3; i++) {
        const fillElement = starContainers[i].querySelector('.absolute') as HTMLElement
        expect(fillElement.style.width).toBe('100%')
      }

      // Fourth star should be 50% filled
      const fourthStar = starContainers[3].querySelector('.absolute') as HTMLElement
      expect(fourthStar.style.width).toBe('50%')

      // Last star should be 0% filled
      const fifthStar = starContainers[4].querySelector('.absolute') as HTMLElement
      expect(fifthStar.style.width).toBe('0%')
    })

    test('should handle decimal ratings correctly', () => {
      const { container } = render(<ProductRating rating={2.7} />)

      const starContainers = container.querySelectorAll('.relative')

      // First 2 stars should be 100% filled
      for (let i = 0; i < 2; i++) {
        const fillElement = starContainers[i].querySelector('.absolute') as HTMLElement
        expect(fillElement.style.width).toBe('100%')
      }

      // Third star should be 70% filled (0.7 * 100%)
      const thirdStar = starContainers[2].querySelector('.absolute') as HTMLElement
      expect(thirdStar.style.width).toBe('70%')

      // Remaining stars should be 0% filled
      for (let i = 3; i < 5; i++) {
        const fillElement = starContainers[i].querySelector('.absolute') as HTMLElement
        expect(fillElement.style.width).toBe('0%')
      }
    })

    test('should handle zero rating', () => {
      const { container } = render(<ProductRating rating={0} />)

      const starContainers = container.querySelectorAll('.relative')

      // All stars should be 0% filled
      starContainers.forEach((star) => {
        const fillElement = star.querySelector('.absolute') as HTMLElement
        expect(fillElement.style.width).toBe('0%')
      })
    })

    test('should handle maximum rating (5.0)', () => {
      const { container } = render(<ProductRating rating={5.0} />)

      const starContainers = container.querySelectorAll('.relative')

      // All stars should be 100% filled
      starContainers.forEach((star) => {
        const fillElement = star.querySelector('.absolute') as HTMLElement
        expect(fillElement.style.width).toBe('100%')
      })
    })

    test('should handle rating above maximum (should cap at 5)', () => {
      const { container } = render(<ProductRating rating={6} />)

      const starContainers = container.querySelectorAll('.relative')

      // All stars should be 100% filled
      starContainers.forEach((star) => {
        const fillElement = star.querySelector('.absolute') as HTMLElement
        expect(fillElement.style.width).toBe('100%')
      })
    })

    test('should handle negative rating (should show as 0)', () => {
      const { container } = render(<ProductRating rating={-1} />)

      const starContainers = container.querySelectorAll('.relative')

      // All stars should be 0% filled
      starContainers.forEach((star) => {
        const fillElement = star.querySelector('.absolute') as HTMLElement
        expect(fillElement.style.width).toBe('0%')
      })
    })
  })

  describe('Visual Structure', () => {
    test('should have proper container structure', () => {
      const { container } = render(<ProductRating rating={3.5} />)

      const mainContainer = container.querySelector('.flex.items-center')
      expect(mainContainer).toBeInTheDocument()

      const starContainers = container.querySelectorAll('.relative')
      expect(starContainers).toHaveLength(5)
    })

    test('should have overlay structure for partial ratings', () => {
      const { container } = render(<ProductRating rating={3.5} />)

      const starContainers = container.querySelectorAll('.relative')

      starContainers.forEach((star) => {
        // Each star should have an absolute positioned overlay
        const overlay = star.querySelector('.absolute.top-0.left-0')
        expect(overlay).toBeInTheDocument()

        // Each overlay should have overflow hidden
        expect(overlay).toHaveClass('overflow-hidden')

        // Should contain an active star SVG
        const activeStar = overlay?.querySelector('svg')
        expect(activeStar).toBeInTheDocument()

        // Should have an inactive star as background
        const inactiveStar = star.querySelector('svg:not(.absolute svg)')
        expect(inactiveStar).toBeInTheDocument()
      })
    })

    test('should have proper SVG structure', () => {
      const { container } = render(<ProductRating rating={3} />)

      const svgs = container.querySelectorAll('svg')

      svgs.forEach((svg) => {
        // Each SVG should have proper viewBox
        expect(svg).toHaveAttribute('viewBox', '0 0 15 15')

        // Each SVG should contain a polygon for the star shape
        const polygon = svg.querySelector('polygon')
        expect(polygon).toBeInTheDocument()

        // Polygon should have proper points
        expect(polygon).toHaveAttribute(
          'points',
          '7.5 .8 9.7 5.4 14.5 5.9 10.7 9.1 11.8 14.2 7.5 11.6 3.2 14.2 4.3 9.1 .5 5.9 5.3 5.4'
        )
      })
    })
  })

  describe('Edge Cases and Precision', () => {
    test('should handle ratings very close to whole numbers', () => {
      const { container } = render(<ProductRating rating={2.99} />)

      const starContainers = container.querySelectorAll('.relative')

      // First 2 stars should be 100%
      for (let i = 0; i < 2; i++) {
        const fillElement = starContainers[i].querySelector('.absolute') as HTMLElement
        expect(fillElement.style.width).toBe('100%')
      }

      // Third star should be 99%
      const thirdStar = starContainers[2].querySelector('.absolute') as HTMLElement
      expect(thirdStar.style.width).toBe('99%')
    })

    test('should handle ratings with many decimal places', () => {
      const { container } = render(<ProductRating rating={3.123456789} />)

      const starContainers = container.querySelectorAll('.relative')

      // Fourth star should handle the precise decimal (0.123456789 * 100%)
      const fourthStar = starContainers[3].querySelector('.absolute') as HTMLElement
      // Use toMatch to handle floating point precision
      expect(fourthStar.style.width).toMatch(/12\.34567/)
    })
  })

  describe('Accessibility', () => {
    test('should maintain proper DOM structure for screen readers', () => {
      const { container } = render(<ProductRating rating={3.5} />)

      // Main container should be a flex container
      const mainContainer = container.querySelector('.flex.items-center')
      expect(mainContainer).toBeInTheDocument()

      // Should have 5 distinct star elements
      const stars = container.querySelectorAll('.relative')
      expect(stars).toHaveLength(5)
    })

    test('should not interfere with keyboard navigation', () => {
      const { container } = render(<ProductRating rating={3} />)

      // Component should not have any interactive elements
      const buttons = container.querySelectorAll('button')
      const links = container.querySelectorAll('a')
      const inputs = container.querySelectorAll('input')

      expect(buttons).toHaveLength(0)
      expect(links).toHaveLength(0)
      expect(inputs).toHaveLength(0)
    })
  })

  describe('Performance', () => {
    test('should render efficiently with different ratings', () => {
      const ratings = [0, 1, 2.5, 3.7, 4.2, 5]

      ratings.forEach((rating) => {
        const { container } = render(<ProductRating rating={rating} />)

        // Should always render exactly 5 stars
        const stars = container.querySelectorAll('.relative')
        expect(stars).toHaveLength(5)

        // Should always render exactly 10 SVGs (2 per star)
        const svgs = container.querySelectorAll('svg')
        expect(svgs).toHaveLength(10)
      })
    })

    test('should not create unnecessary DOM elements', () => {
      const { container } = render(<ProductRating rating={3.5} />)

      // Should have minimal DOM structure
      const allElements = container.querySelectorAll('*')

      // Expected structure: 1 container + 5 star containers + 5 overlays + 10 SVGs + 10 polygons = 31 elements
      expect(allElements.length).toBe(31)
    })
  })
})
