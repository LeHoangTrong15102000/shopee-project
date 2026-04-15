import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import RegisterLayout from '../RegisterLayout'

// Mock react-router
vi.mock('react-router', () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}))

// Mock components
vi.mock('src/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}))

vi.mock('src/components/RegisterHeader', () => ({
  default: () => <header data-testid="register-header">Register Header</header>,
}))

vi.mock('src/components/PageTransition', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
}))

describe('RegisterLayout', () => {
  beforeEach(() => {
    // Mock window.scrollTo
    window.scrollTo = vi.fn()
  })

  it('renders without crashing', () => {
    render(<RegisterLayout />)
    expect(screen.getByTestId('register-header')).toBeInTheDocument()
  })

  it('contains RegisterHeader component', () => {
    render(<RegisterLayout />)
    const header = screen.getByTestId('register-header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveTextContent('Register Header')
  })

  it('contains Footer component', () => {
    render(<RegisterLayout />)
    const footer = screen.getByTestId('footer')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveTextContent('Footer')
  })

  it('contains Outlet for nested routes', () => {
    render(<RegisterLayout />)
    const outlet = screen.getByTestId('outlet')
    expect(outlet).toBeInTheDocument()
    expect(outlet).toHaveTextContent('Outlet Content')
  })

  it('wraps content in PageTransition component', () => {
    render(<RegisterLayout />)
    expect(screen.getByTestId('page-transition')).toBeInTheDocument()
  })

  it('has correct layout structure with min-h-screen and background classes', () => {
    const { container } = render(<RegisterLayout />)
    const layoutDiv = container.firstChild as HTMLElement
    expect(layoutDiv).toHaveClass('min-h-screen', 'bg-gray-100', 'dark:bg-slate-900')
  })

  it('renders children when provided', () => {
    render(
      <RegisterLayout>
        <div data-testid="custom-child">Custom Content</div>
      </RegisterLayout>,
    )
    expect(screen.getByTestId('custom-child')).toBeInTheDocument()
    expect(screen.getByTestId('custom-child')).toHaveTextContent('Custom Content')
  })

  it('scrolls to top on mount', () => {
    render(<RegisterLayout />)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
