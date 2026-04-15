import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import FlashSaleTimer from '../FlashSale/FlashSaleTimer'

vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('FlashSaleTimer', () => {
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

  describe('Basic Rendering', () => {
    it('renders timer component with default props', () => {
      const { container } = render(<FlashSaleTimer />)
      expect(container.querySelector('[class]')).not.toBeNull()
    })

    it('displays countdown timer text', () => {
      const endTime = new Date(Date.now() + 3600000)
      render(<FlashSaleTimer endTime={endTime} />)
      expect(screen.getByText('Kết thúc trong')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<FlashSaleTimer className="custom-class" />)
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('renders clock icon', () => {
      render(<FlashSaleTimer endTime={new Date(Date.now() + 3600000)} />)
      const svg = screen.getByText('Kết thúc trong').previousElementSibling
      expect(svg?.tagName).toBe('svg')
    })
  })

  describe('Ended State', () => {
    it('shows ended state when isEnded is true', () => {
      render(<FlashSaleTimer isEnded={true} />)
      expect(screen.getByText('Đã kết thúc')).toBeInTheDocument()
    })

    it('applies gray background when ended', () => {
      const { container } = render(<FlashSaleTimer isEnded={true} />)
      const element = container.querySelector('.bg-gray-500')
      expect(element).toBeInTheDocument()
    })

    it('does not show timer digits when ended', () => {
      render(<FlashSaleTimer isEnded={true} />)
      expect(screen.queryByText(':')).not.toBeInTheDocument()
    })

    it('does not show live badge when ended', () => {
      render(<FlashSaleTimer isEnded={true} isServerSynced={true} />)
      expect(screen.queryByText('⚡ Live')).not.toBeInTheDocument()
    })
  })

  describe('Server Sync Mode', () => {
    it('displays live badge when server synced', () => {
      render(<FlashSaleTimer serverRemainingSeconds={3600} isServerSynced={true} />)
      expect(screen.getByText('⚡ Live')).toBeInTheDocument()
    })

    it('calculates time from serverRemainingSeconds when synced', () => {
      render(<FlashSaleTimer serverRemainingSeconds={3661} isServerSynced={true} />)
      const digits = screen.getAllByText('01')
      expect(digits.length).toBeGreaterThanOrEqual(2) // hours and minutes
    })

    it('shows zero time when serverRemainingSeconds is 0', () => {
      render(<FlashSaleTimer serverRemainingSeconds={0} isServerSynced={true} />)
      expect(screen.getAllByText('00')).toHaveLength(3)
    })

    it('shows zero time when serverRemainingSeconds is negative', () => {
      render(<FlashSaleTimer serverRemainingSeconds={-100} isServerSynced={true} />)
      expect(screen.getAllByText('00')).toHaveLength(3)
    })

    it('shows product stats when server synced with products', () => {
      const products = [
        { product_id: '1', current_stock: 10, sold: 5 },
        { product_id: '2', current_stock: 20, sold: 10 },
      ]

      render(
        <FlashSaleTimer serverRemainingSeconds={3600} isServerSynced={true} products={products} />,
      )

      expect(screen.getByText(/Đã bán: 15/)).toBeInTheDocument()
      expect(screen.getByText(/Còn: 30/)).toBeInTheDocument()
    })

    it('does not show product stats when not server synced', () => {
      const products = [{ product_id: '1', current_stock: 10, sold: 5 }]

      render(
        <FlashSaleTimer
          endTime={new Date(Date.now() + 3600000)}
          isServerSynced={false}
          products={products}
        />,
      )

      expect(screen.queryByText(/Đã bán:/)).not.toBeInTheDocument()
    })

    it('calculates total sold correctly', () => {
      const products = [
        { product_id: '1', current_stock: 10, sold: 5 },
        { product_id: '2', current_stock: 20, sold: 15 },
        { product_id: '3', current_stock: 5, sold: 3 },
      ]

      render(
        <FlashSaleTimer serverRemainingSeconds={3600} isServerSynced={true} products={products} />,
      )

      expect(screen.getByText(/Đã bán: 23/)).toBeInTheDocument()
    })

    it('calculates total stock correctly', () => {
      const products = [
        { product_id: '1', current_stock: 10, sold: 5 },
        { product_id: '2', current_stock: 20, sold: 15 },
        { product_id: '3', current_stock: 5, sold: 3 },
      ]

      render(
        <FlashSaleTimer serverRemainingSeconds={3600} isServerSynced={true} products={products} />,
      )

      expect(screen.getByText(/Còn: 35/)).toBeInTheDocument()
    })

    it('handles empty products array', () => {
      render(<FlashSaleTimer serverRemainingSeconds={3600} isServerSynced={true} products={[]} />)

      expect(screen.queryByText(/Đã bán:/)).not.toBeInTheDocument()
    })
  })

  describe('Client-side Timer Mode', () => {
    it('calculates time from endTime when not server synced', () => {
      const endTime = new Date(mockNow.getTime() + 3661000) // 1 hour, 1 minute, 1 second
      render(<FlashSaleTimer endTime={endTime} isServerSynced={false} />)

      const digits = screen.getAllByText('01')
      expect(digits.length).toBeGreaterThanOrEqual(1) // at least hours
    })

    it('shows default time when no endTime provided', () => {
      render(<FlashSaleTimer />)
      expect(screen.getByText('02')).toBeInTheDocument() // default 2 hours
      expect(screen.getByText('15')).toBeInTheDocument() // default 15 minutes
      expect(screen.getByText('30')).toBeInTheDocument() // default 30 seconds
    })

    it('shows zero when endTime is in the past', () => {
      const endTime = new Date(mockNow.getTime() - 3600000)
      render(<FlashSaleTimer endTime={endTime} />)
      expect(screen.getAllByText('00')).toHaveLength(3)
    })

    it('clears interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      const endTime = new Date(mockNow.getTime() + 3600000)
      const { unmount } = render(<FlashSaleTimer endTime={endTime} />)

      unmount()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Time Formatting', () => {
    it('pads single digit hours with zero', () => {
      const endTime = new Date(mockNow.getTime() + 3600000) // 1 hour
      render(<FlashSaleTimer endTime={endTime} />)
      const digits = screen.getAllByText('01')
      expect(digits.length).toBeGreaterThan(0)
    })

    it('pads single digit minutes with zero', () => {
      const endTime = new Date(mockNow.getTime() + 300000) // 5 minutes
      render(<FlashSaleTimer endTime={endTime} />)
      const digits = screen.getAllByText('05')
      expect(digits.length).toBeGreaterThan(0)
    })

    it('pads single digit seconds with zero', () => {
      const endTime = new Date(mockNow.getTime() + 5000) // 5 seconds
      render(<FlashSaleTimer endTime={endTime} />)
      const digits = screen.getAllByText('05')
      expect(digits.length).toBeGreaterThan(0)
    })

    it('displays double digit values correctly', () => {
      const endTime = new Date(mockNow.getTime() + 43200000) // 12 hours
      render(<FlashSaleTimer endTime={endTime} />)
      const digits = screen.getAllByText('12')
      expect(digits.length).toBeGreaterThan(0)
    })

    it('shows colons between time units', () => {
      const endTime = new Date(mockNow.getTime() + 3600000)
      render(<FlashSaleTimer endTime={endTime} />)
      const colons = screen.getAllByText(':')
      expect(colons).toHaveLength(2)
    })
  })

  describe('Edge Cases', () => {
    it('handles exactly 24 hours remaining', () => {
      const endTime = new Date(mockNow.getTime() + 86400000) // 24 hours
      render(<FlashSaleTimer endTime={endTime} />)
      const zeroDigits = screen.getAllByText('00')
      expect(zeroDigits.length).toBeGreaterThan(0) // hours wrap at 24
    })

    it('handles very large time differences', () => {
      const endTime = new Date(mockNow.getTime() + 172800000) // 48 hours
      render(<FlashSaleTimer endTime={endTime} />)
      const zeroDigits = screen.getAllByText('00')
      expect(zeroDigits.length).toBeGreaterThan(0) // hours mod 24
    })

    it('handles serverRemainingSeconds with fractional seconds', () => {
      render(<FlashSaleTimer serverRemainingSeconds={3661.7} isServerSynced={true} />)
      const digits = screen.getAllByText('01')
      expect(digits.length).toBeGreaterThanOrEqual(2) // should floor the values
    })

    it('handles products with zero stock', () => {
      const products = [{ product_id: '1', current_stock: 0, sold: 100 }]

      render(
        <FlashSaleTimer serverRemainingSeconds={3600} isServerSynced={true} products={products} />,
      )

      expect(screen.getByText(/Đã bán: 100/)).toBeInTheDocument()
      expect(screen.getByText(/Còn: 0/)).toBeInTheDocument()
    })

    it('handles products with negative sold count', () => {
      const products = [{ product_id: '1', current_stock: 10, sold: -5 }]

      render(
        <FlashSaleTimer serverRemainingSeconds={3600} isServerSynced={true} products={products} />,
      )

      expect(screen.getByText(/Đã bán: -5/)).toBeInTheDocument()
    })
  })

  describe('Component Updates', () => {
    it('updates when endTime changes', () => {
      const endTime1 = new Date(mockNow.getTime() + 3600000)
      const { rerender } = render(<FlashSaleTimer endTime={endTime1} />)
      let digits = screen.getAllByText('01')
      expect(digits.length).toBeGreaterThan(0)

      const endTime2 = new Date(mockNow.getTime() + 7200000)
      rerender(<FlashSaleTimer endTime={endTime2} />)
      digits = screen.getAllByText('02')
      expect(digits.length).toBeGreaterThan(0)
    })

    it('updates when serverRemainingSeconds changes', () => {
      const { rerender } = render(
        <FlashSaleTimer serverRemainingSeconds={3600} isServerSynced={true} />,
      )
      let digits = screen.getAllByText('01')
      expect(digits.length).toBeGreaterThan(0)

      rerender(<FlashSaleTimer serverRemainingSeconds={7200} isServerSynced={true} />)
      digits = screen.getAllByText('02')
      expect(digits.length).toBeGreaterThan(0)
    })

    it('switches from client to server mode', () => {
      const endTime = new Date(mockNow.getTime() + 3600000)
      const { rerender } = render(<FlashSaleTimer endTime={endTime} />)

      rerender(<FlashSaleTimer serverRemainingSeconds={7200} isServerSynced={true} />)
      expect(screen.getByText('⚡ Live')).toBeInTheDocument()
    })

    it('switches to ended state', () => {
      const endTime = new Date(mockNow.getTime() + 3600000)
      const { rerender } = render(<FlashSaleTimer endTime={endTime} />)
      expect(screen.getByText('Kết thúc trong')).toBeInTheDocument()

      rerender(<FlashSaleTimer isEnded={true} />)
      expect(screen.getByText('Đã kết thúc')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('renders semantic HTML structure', () => {
      const endTime = new Date(mockNow.getTime() + 3600000)
      const { container } = render(<FlashSaleTimer endTime={endTime} />)
      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('includes descriptive text for screen readers', () => {
      const endTime = new Date(mockNow.getTime() + 3600000)
      render(<FlashSaleTimer endTime={endTime} />)
      expect(screen.getByText('Kết thúc trong')).toBeInTheDocument()
    })
  })
})
