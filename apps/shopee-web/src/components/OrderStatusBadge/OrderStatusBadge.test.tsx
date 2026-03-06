import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import OrderStatusBadge from './OrderStatusBadge'

describe('OrderStatusBadge', () => {
  it('renders pending status correctly', () => {
    const { container } = render(<OrderStatusBadge status='pending' />)
    const badge = container.querySelector('span')
    expect(badge).toBeInTheDocument()
    // Pending status uses amber colors
    expect(badge).toHaveClass('bg-amber-50/80')
  })

  it('renders delivered status correctly', () => {
    const { container } = render(<OrderStatusBadge status='delivered' />)
    const badge = container.querySelector('span')
    expect(badge).toBeInTheDocument()
    // Delivered status uses emerald colors
    expect(badge).toHaveClass('bg-emerald-50/80')
  })

  it('renders cancelled status correctly', () => {
    const { container } = render(<OrderStatusBadge status='cancelled' />)
    const badge = container.querySelector('span')
    expect(badge).toBeInTheDocument()
    // Cancelled status uses rose colors
    expect(badge).toHaveClass('bg-rose-50/80')
  })

  it('renders a span element with correct structure', () => {
    const { container } = render(<OrderStatusBadge status='pending' size='lg' />)
    const span = container.querySelector('span')
    expect(span).toBeInTheDocument()
    expect(span).toHaveClass('inline-flex')
  })
})
