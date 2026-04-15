import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Timeline from '../Timeline'

describe('Timeline', () => {
  it('renders children', () => {
    render(
      <Timeline>
        <div>content</div>
      </Timeline>,
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Timeline className="custom">
        <div>content</div>
      </Timeline>,
    )
    expect(container.firstChild).toHaveClass('custom')
  })
})

describe('Timeline.Step', () => {
  it('renders completed step', () => {
    render(<Timeline.Step state="completed" label="Order placed" />)
    expect(screen.getByText('Order placed')).toBeInTheDocument()
  })

  it('renders current step', () => {
    render(<Timeline.Step state="current" label="Processing" />)
    expect(screen.getByText('Processing')).toBeInTheDocument()
  })

  it('renders pending step', () => {
    render(<Timeline.Step state="pending" label="Delivery" />)
    expect(screen.getByText('Delivery')).toBeInTheDocument()
  })

  it('renders cancelled step', () => {
    render(<Timeline.Step state="cancelled" label="Cancelled" />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<Timeline.Step state="completed" label="Done" description="All good" />)
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('renders timestamp when provided', () => {
    render(<Timeline.Step state="completed" label="Done" timestamp="2024-01-01" />)
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
  })

  it('renders icon for completed step', () => {
    const { container } = render(
      <Timeline.Step state="completed" label="Done" icon={<span>✓</span>} />,
    )
    expect(container.textContent).toContain('✓')
  })
})

describe('Timeline.Line', () => {
  it('renders inactive line by default', () => {
    const { container } = render(<Timeline.Line />)
    expect(container.firstChild).toHaveClass('bg-gray-200')
  })

  it('renders active line', () => {
    const { container } = render(<Timeline.Line active />)
    expect(container.firstChild).toHaveClass('bg-green-500')
  })
})
