import { render, screen } from '@testing-library/react'
import { LoadingState } from './LoadingState'

describe('LoadingState', () => {
  it('renders spinner by default', () => {
    render(<LoadingState />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders skeleton variant', () => {
    render(<LoadingState variant="skeleton" rows={3} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders full page spinner', () => {
    render(<LoadingState fullPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders custom number of skeleton rows', () => {
    const { container } = render(<LoadingState variant="skeleton" rows={7} />)
    // Skeleton component renders divs inside the status container
    const statusEl = container.querySelector('[role="status"]')
    expect(statusEl).toBeInTheDocument()
    expect(statusEl!.children.length).toBe(7)
  })

  it('applies custom className to spinner wrapper', () => {
    const { container } = render(<LoadingState className="my-custom-class" />)
    const statusEl = container.querySelector('[role="status"]')
    expect(statusEl).toHaveClass('my-custom-class')
  })

  it('applies custom className to skeleton wrapper', () => {
    const { container } = render(<LoadingState variant="skeleton" className="skeleton-wrapper" />)
    const statusEl = container.querySelector('[role="status"]')
    expect(statusEl).toHaveClass('skeleton-wrapper')
  })

  it('renders fullPage spinner with fixed positioning class', () => {
    const { container } = render(<LoadingState fullPage />)
    const statusEl = container.querySelector('[role="status"]')
    expect(statusEl).toHaveClass('fixed')
  })
})
