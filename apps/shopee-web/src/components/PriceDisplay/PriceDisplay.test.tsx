import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PriceDisplay from './PriceDisplay'

describe('PriceDisplay', () => {
  it('renders price correctly', () => {
    const { container } = render(<PriceDisplay price={250000} />)
    // Price renders as ₫ (in child span) + 250.000 (text node) inside parent span
    expect(container.textContent).toContain('250.000')
  })

  it('shows original price with strikethrough when discounted', () => {
    const { container } = render(<PriceDisplay price={200000} originalPrice={300000} />)
    // Original price renders as ₫300.000 in a single line-through span
    const strikethrough = container.querySelector('.line-through')
    expect(strikethrough).toBeInTheDocument()
    expect(strikethrough?.textContent).toContain('300.000')
    // Current price also present
    expect(container.textContent).toContain('200.000')
  })

  it('displays discount percentage badge', () => {
    render(<PriceDisplay price={200000} originalPrice={400000} showDiscount />)
    expect(screen.getByText('-50%')).toBeInTheDocument()
  })

  it('hides discount badge when showDiscount is false', () => {
    render(<PriceDisplay price={200000} originalPrice={400000} showDiscount={false} />)
    expect(screen.queryByText('-50%')).not.toBeInTheDocument()
  })
})
