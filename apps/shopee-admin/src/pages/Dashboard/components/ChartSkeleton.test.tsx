import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import { ChartSkeleton } from './ChartSkeleton'

describe('ChartSkeleton', () => {
  it('renders with default 2 columns', () => {
    renderWithProviders(<ChartSkeleton />)
    const container = screen.getByLabelText('Loading charts')
    expect(container).toBeInTheDocument()
    expect(container).toHaveAttribute('aria-busy', 'true')
  })

  it('renders with 3 columns when specified', () => {
    renderWithProviders(<ChartSkeleton columns={3} />)
    const container = screen.getByLabelText('Loading charts')
    expect(container).toBeInTheDocument()
  })

  it('renders correct number of skeleton cards for 2 columns', () => {
    const { container } = renderWithProviders(<ChartSkeleton columns={2} />)
    const cards = container.querySelectorAll('[data-slot="card"]')
    expect(cards.length).toBe(2)
  })

  it('renders correct number of skeleton cards for 3 columns', () => {
    const { container } = renderWithProviders(<ChartSkeleton columns={3} />)
    const cards = container.querySelectorAll('[data-slot="card"]')
    expect(cards.length).toBe(3)
  })

  it('renders skeleton elements inside cards', () => {
    const { container } = renderWithProviders(<ChartSkeleton />)
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('handles unknown column count gracefully', () => {
    renderWithProviders(<ChartSkeleton columns={5} />)
    const container = screen.getByLabelText('Loading charts')
    expect(container).toBeInTheDocument()
  })
})
