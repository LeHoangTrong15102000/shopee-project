import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PriceDropBadge from '../PriceDropBadge'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

let mockReducedMotion = false

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}))

describe('PriceDropBadge', () => {
  it('should render discount badge when there is a price drop', () => {
    render(<PriceDropBadge originalPrice={100} currentPrice={80} />)
    expect(screen.getByText(/Giảm 20%/)).toBeInTheDocument()
  })

  it('should not render when current price equals original price', () => {
    const { container } = render(<PriceDropBadge originalPrice={100} currentPrice={100} />)
    expect(container.firstChild).toBeNull()
  })

  it('should not render when current price is higher than original price', () => {
    const { container } = render(<PriceDropBadge originalPrice={100} currentPrice={120} />)
    expect(container.firstChild).toBeNull()
  })

  it('should not render when original price is zero or negative', () => {
    const { container } = render(<PriceDropBadge originalPrice={0} currentPrice={50} />)
    expect(container.firstChild).toBeNull()
  })

  it('should calculate discount percentage correctly', () => {
    render(<PriceDropBadge originalPrice={200} currentPrice={150} />)
    expect(screen.getByText(/Giảm 25%/)).toBeInTheDocument()
  })

  it('should round discount percentage', () => {
    render(<PriceDropBadge originalPrice={100} currentPrice={67} />)
    expect(screen.getByText(/Giảm 33%/)).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <PriceDropBadge originalPrice={100} currentPrice={80} className="custom-class" />,
    )
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('should have proper aria-label', () => {
    render(<PriceDropBadge originalPrice={100} currentPrice={75} />)
    expect(screen.getByLabelText('Giá đã giảm 25 phần trăm')).toBeInTheDocument()
  })

  it('should render with reduced motion', () => {
    mockReducedMotion = true
    render(<PriceDropBadge originalPrice={100} currentPrice={80} />)
    expect(screen.getByText(/Giảm 20%/)).toBeInTheDocument()
  })
})
