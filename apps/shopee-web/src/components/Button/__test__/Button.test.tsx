import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../Button'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} data-testid="link" {...props}>
      {children}
    </a>
  ),
}))

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('renders as button by default', () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders as link when as="link"', () => {
    render(
      <Button as="link" to="/test">
        Link
      </Button>,
    )
    expect(screen.getByTestId('link')).toBeInTheDocument()
  })

  it('calls onClick handler', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  it('is disabled when disabled prop', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when loading', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows loading spinner when isLoading', () => {
    const { container } = render(<Button isLoading>Loading</Button>)
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
  })

  it('sets aria-busy when loading', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('sets aria-label', () => {
    render(<Button ariaLabel="Submit form">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Submit form')
  })

  it('applies primary variant classes', () => {
    render(<Button variant="primary">Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-orange')
  })

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-white')
  })

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Danger</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-red-500')
  })

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-transparent')
  })

  it('applies size classes', () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('py-3')
  })

  it('applies shape classes', () => {
    render(<Button shape="pill">Pill</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('rounded-full')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('custom-class')
  })

  it('adds cursor-not-allowed when disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('cursor-not-allowed')
  })

  it('adds hover animation when animated', () => {
    render(<Button animated>Animated</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('transition-all')
  })

  it('does not add hover animation when animated=false', () => {
    render(<Button animated={false}>Static</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).not.toContain('hover:scale')
  })

  it('shows spinner in link mode when loading', () => {
    const { container } = render(
      <Button as="link" to="/test" isLoading>
        Link
      </Button>,
    )
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
  })
})
