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
})
