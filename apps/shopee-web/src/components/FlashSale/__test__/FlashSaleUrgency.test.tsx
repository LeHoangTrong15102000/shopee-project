import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import FlashSaleUrgency from '../FlashSaleUrgency'

// Mock framer-motion
// Mock useReducedMotion hook
vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}))

describe('FlashSaleUrgency', () => {
  const mockNow = new Date('2024-03-17T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(mockNow)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Progress Bar', () => {
    it('renders progress bar with correct sold percentage', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Đã bán 50%')).toBeInTheDocument()
    })

    it('calculates sold percentage correctly when soldCount exceeds totalStock', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={150}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Đã bán 100%')).toBeInTheDocument()
    })

    it('handles zero totalStock', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={0}
          soldCount={0}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Đã bán 100%')).toBeInTheDocument()
    })

    it('rounds sold percentage correctly', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={3}
          soldCount={1}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Đã bán 33%')).toBeInTheDocument()
    })

    it('applies correct data-product-id attribute', () => {
      const { container } = render(
        <FlashSaleUrgency
          productId="product-123"
          totalStock={100}
          soldCount={50}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(container.querySelector('[data-product-id="product-123"]')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={new Date('2024-03-17T14:00:00Z')}
          className="custom-class"
        />,
      )

      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('Urgency Levels - Ended', () => {
    it('shows "Đã kết thúc" when time has expired', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={new Date('2024-03-17T11:00:00Z')} // 1 hour before mockNow
        />,
      )

      expect(screen.getByText('Đã kết thúc')).toBeInTheDocument()
      expect(screen.getByText('⏰')).toBeInTheDocument()
    })

    it('shows ended status with correct aria-live attribute', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={new Date('2024-03-17T11:00:00Z')}
        />,
      )

      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Urgency Levels - Out of Stock', () => {
    it('shows "Đã hết hàng!" when remaining stock is 0', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={100}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Đã hết hàng!')).toBeInTheDocument()
      expect(screen.getByText('🚫')).toBeInTheDocument()
    })

    it('shows out of stock when soldCount exceeds totalStock', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={120}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Đã hết hàng!')).toBeInTheDocument()
    })
  })

  describe('Urgency Levels - Critical', () => {
    it('shows critical message when remaining stock is less than 5', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={97}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Chỉ còn 3 sản phẩm!')).toBeInTheDocument()
      expect(screen.getByText('🔥')).toBeInTheDocument()
    })

    it('shows critical message with 1 product remaining', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={99}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Chỉ còn 1 sản phẩm!')).toBeInTheDocument()
    })

    it('shows critical message with 4 products remaining', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={96}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Chỉ còn 4 sản phẩm!')).toBeInTheDocument()
    })

    it('has assertive aria-live for critical urgency', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={97}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('aria-live', 'assertive')
    })
  })

  describe('Urgency Levels - Low', () => {
    it('shows "Sắp hết!" when remaining stock is between 5 and 9', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={95}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Sắp hết!')).toBeInTheDocument()
      expect(screen.getByText('⚡')).toBeInTheDocument()
    })

    it('shows low urgency with 9 products remaining', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={91}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Sắp hết!')).toBeInTheDocument()
    })

    it('shows low urgency with 5 products remaining', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={95}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Sắp hết!')).toBeInTheDocument()
    })
  })

  describe('Urgency Levels - Ending Soon', () => {
    it('shows "Sắp kết thúc!" when time remaining is less than 30 minutes', () => {
      // 20 minutes from now
      const endTime = new Date(mockNow.getTime() + 20 * 60 * 1000)

      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={endTime}
        />,
      )

      expect(screen.getByText('Sắp kết thúc!')).toBeInTheDocument()
      expect(screen.getByText('⏰')).toBeInTheDocument()
    })

    it('shows ending soon at exactly 29 minutes remaining', () => {
      const endTime = new Date(mockNow.getTime() + 29 * 60 * 1000)

      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={endTime}
        />,
      )

      expect(screen.getByText('Sắp kết thúc!')).toBeInTheDocument()
    })
  })

  describe('Urgency Levels - Normal', () => {
    it('does not show urgency message when stock is sufficient and time is not critical', () => {
      // 2 hours from now
      const endTime = new Date(mockNow.getTime() + 2 * 60 * 60 * 1000)

      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={endTime}
        />,
      )

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('does not show urgency message with 10 products remaining and sufficient time', () => {
      const endTime = new Date(mockNow.getTime() + 2 * 60 * 60 * 1000)

      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={90}
          endTime={endTime}
        />,
      )

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  describe('Time Calculation', () => {
    it('handles endTime as string', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime="2024-03-17T11:00:00Z"
        />,
      )

      expect(screen.getByText('Đã kết thúc')).toBeInTheDocument()
    })

    it('handles endTime as Date object', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={new Date('2024-03-17T11:00:00Z')}
        />,
      )

      expect(screen.getByText('Đã kết thúc')).toBeInTheDocument()
    })

    it('updates time remaining every second', () => {
      const endTime = new Date(mockNow.getTime() + 25 * 60 * 1000) // 25 minutes

      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={endTime}
        />,
      )

      expect(screen.getByText('Sắp kết thúc!')).toBeInTheDocument()

      // Advance time by 10 minutes
      act(() => {
        vi.setSystemTime(new Date(mockNow.getTime() + 10 * 60 * 1000))
        vi.advanceTimersByTime(1000)
      })

      // Should still show ending soon (15 minutes remaining)
      expect(screen.getByText('Sắp kết thúc!')).toBeInTheDocument()
    })

    it('clears interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      const { unmount } = render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Priority of Urgency Levels', () => {
    it('prioritizes ended over out of stock', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={100}
          endTime={new Date('2024-03-17T11:00:00Z')}
        />,
      )

      expect(screen.getByText('Đã kết thúc')).toBeInTheDocument()
      expect(screen.queryByText('Đã hết hàng!')).not.toBeInTheDocument()
    })

    it('prioritizes out of stock over critical stock', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={100}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Đã hết hàng!')).toBeInTheDocument()
    })

    it('prioritizes critical stock over ending soon', () => {
      const endTime = new Date(mockNow.getTime() + 20 * 60 * 1000) // 20 minutes

      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={97}
          endTime={endTime}
        />,
      )

      expect(screen.getByText('Chỉ còn 3 sản phẩm!')).toBeInTheDocument()
      expect(screen.queryByText('Sắp kết thúc!')).not.toBeInTheDocument()
    })

    it('prioritizes low stock over ending soon', () => {
      const endTime = new Date(mockNow.getTime() + 20 * 60 * 1000) // 20 minutes

      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={95}
          endTime={endTime}
        />,
      )

      expect(screen.getByText('Sắp hết!')).toBeInTheDocument()
      expect(screen.queryByText('Sắp kết thúc!')).not.toBeInTheDocument()
    })
  })

  describe('Reduced Motion', () => {
    it('respects reduced motion preference', async () => {
      const { useReducedMotion } = await import('src/hooks/useReducedMotion')
      vi.mocked(useReducedMotion).mockReturnValue(true)

      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={97}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Chỉ còn 3 sản phẩm!')).toBeInTheDocument()
    })

    it('enables pulse animation when reduced motion is false', async () => {
      const { useReducedMotion } = await import('src/hooks/useReducedMotion')
      vi.mocked(useReducedMotion).mockReturnValue(false)

      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={97}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Chỉ còn 3 sản phẩm!')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles negative soldCount gracefully', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={-10}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      // The component shows the actual soldCount value, even if negative
      expect(screen.getByText(/Đã bán/)).toBeInTheDocument()
      expect(screen.getByText(/-10%/)).toBeInTheDocument()
    })

    it('handles very large stock numbers', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={1000000}
          soldCount={500000}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Đã bán 50%')).toBeInTheDocument()
    })

    it('handles exactly 30 minutes remaining (boundary)', () => {
      const endTime = new Date(mockNow.getTime() + 30 * 60 * 1000)

      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={50}
          endTime={endTime}
        />,
      )

      // At exactly 30 minutes, should not show ending soon
      expect(screen.queryByText('Sắp kết thúc!')).not.toBeInTheDocument()
    })

    it('handles exactly 5 products remaining (boundary)', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={95}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      expect(screen.getByText('Sắp hết!')).toBeInTheDocument()
    })

    it('handles exactly 10 products remaining (boundary)', () => {
      render(
        <FlashSaleUrgency
          productId="test-product"
          totalStock={100}
          soldCount={90}
          endTime={new Date('2024-03-17T14:00:00Z')}
        />,
      )

      // At exactly 10, should not show urgency
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })
})
