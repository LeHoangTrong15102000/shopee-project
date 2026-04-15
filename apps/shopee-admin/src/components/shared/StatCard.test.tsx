import { render, screen } from '@testing-library/react'
import { StatCard } from './StatCard'

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Revenue" value={1000} />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument()
  })

  it('uses formatter when provided', () => {
    render(<StatCard label="Revenue" value={1000} formatter={(v) => `$${v}`} />)
    expect(screen.getByText('$1000')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<StatCard label="Test" value={0} icon={<span data-testid="icon">📊</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('shows positive trend', () => {
    render(<StatCard label="Test" value={100} trend={12.5} />)
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('shows negative trend', () => {
    render(<StatCard label="Test" value={100} trend={-5.3} />)
    expect(screen.getByText('-5.3%')).toBeInTheDocument()
  })

  it('hides trend when zero', () => {
    render(<StatCard label="Test" value={100} trend={0} />)
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })
})
