import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WishlistStats from '../WishlistStats'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, whileHover, layout, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const defaultProps = {
  itemCount: 5,
  totalValue: 1500000,
  totalSavings: 300000,
  avgDiscount: 20,
  itemVariants: {},
  containerVariants: {},
  isMobile: false,
}

describe('WishlistStats', () => {
  it('renders all 4 stat cards', () => {
    render(<WishlistStats {...defaultProps} />)
    const cards = document.querySelectorAll('.flex.items-center.gap-3')
    expect(cards.length).toBeGreaterThanOrEqual(4)
  })

  it('displays item count correctly', () => {
    render(<WishlistStats {...defaultProps} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('displays total value with currency symbol', () => {
    render(<WishlistStats {...defaultProps} />)
    expect(screen.getByText(/1\.500\.000/)).toBeInTheDocument()
  })

  it('displays total savings with currency symbol', () => {
    render(<WishlistStats {...defaultProps} />)
    expect(screen.getByText(/300\.000/)).toBeInTheDocument()
  })

  it('displays average discount with percent sign', () => {
    render(<WishlistStats {...defaultProps} />)
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('renders stat labels from translations', () => {
    render(<WishlistStats {...defaultProps} />)
    expect(screen.getByText('Yêu thích')).toBeInTheDocument()
    expect(screen.getByText('Tổng giá trị')).toBeInTheDocument()
    expect(screen.getByText('Tiết kiệm')).toBeInTheDocument()
    expect(screen.getByText('TB giảm giá')).toBeInTheDocument()
  })

  it('renders with zero values', () => {
    render(
      <WishlistStats
        {...defaultProps}
        itemCount={0}
        totalValue={0}
        totalSavings={0}
        avgDiscount={0}
      />,
    )
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders with large values', () => {
    render(
      <WishlistStats
        {...defaultProps}
        itemCount={999}
        totalValue={99999999}
        totalSavings={50000000}
        avgDiscount={75}
      />,
    )
    expect(screen.getByText('999')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('renders in mobile mode (isMobile=true)', () => {
    render(<WishlistStats {...defaultProps} isMobile={true} />)
    // Should render without animated motion in mobile
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders grid with correct column classes', () => {
    const { container } = render(<WishlistStats {...defaultProps} />)
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid?.classList.contains('grid-cols-2')).toBe(true)
  })
})
