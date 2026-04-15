import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MainLayout from '../MainLayout'

// Mock react-router
vi.mock('react-router', () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}))

// Mock components
vi.mock('src/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}))

vi.mock('src/components/Header', () => ({
  default: () => <header data-testid="header">Header</header>,
}))

vi.mock('src/components/PageTransition', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
}))

vi.mock('src/components/CompareFloatingBar', () => ({
  default: ({ comparePath }: { comparePath: string }) => (
    <div data-testid="compare-floating-bar" data-compare-path={comparePath}>
      Compare Floating Bar
    </div>
  ),
}))

vi.mock('src/components/ConnectionStatus', () => ({
  default: () => <div data-testid="connection-status">Connection Status</div>,
}))

vi.mock('src/components/BackToTop', () => ({
  default: () => <button data-testid="back-to-top">Back to Top</button>,
}))

describe('MainLayout', () => {
  beforeEach(() => {
    // Mock window.scrollTo
    window.scrollTo = vi.fn()
    // Reset scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
  })

  it('renders without crashing', () => {
    render(<MainLayout />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('contains Header component', () => {
    render(<MainLayout />)
    const header = screen.getByTestId('header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveTextContent('Header')
  })

  it('contains Footer component', () => {
    render(<MainLayout />)
    const footer = screen.getByTestId('footer')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveTextContent('Footer')
  })

  it('contains Outlet for nested routes', () => {
    render(<MainLayout />)
    const outlet = screen.getByTestId('outlet')
    expect(outlet).toBeInTheDocument()
    expect(outlet).toHaveTextContent('Outlet Content')
  })

  it('wraps content in PageTransition component', () => {
    render(<MainLayout />)
    expect(screen.getByTestId('page-transition')).toBeInTheDocument()
  })

  it('has correct layout structure with min-h-screen and background classes', () => {
    const { container } = render(<MainLayout />)
    const layoutDiv = container.firstChild as HTMLElement
    expect(layoutDiv).toHaveClass('min-h-screen', 'bg-gray-100', 'dark:bg-slate-900')
  })

  it('renders children when provided', () => {
    render(
      <MainLayout>
        <div data-testid="custom-child">Custom Content</div>
      </MainLayout>,
    )
    expect(screen.getByTestId('custom-child')).toBeInTheDocument()
    expect(screen.getByTestId('custom-child')).toHaveTextContent('Custom Content')
  })

  it('renders ConnectionStatus component within Suspense', async () => {
    render(<MainLayout />)
    // Lazy-loaded component wrapped in Suspense with fallback={null}
    // In test environment, it should still render
    const connectionStatus = await screen.findByTestId('connection-status')
    expect(connectionStatus).toBeInTheDocument()
  })

  it('renders CompareFloatingBar with correct comparePath prop within Suspense', async () => {
    render(<MainLayout />)
    // Lazy-loaded component wrapped in Suspense with fallback={null}
    const compareBar = await screen.findByTestId('compare-floating-bar')
    expect(compareBar).toBeInTheDocument()
    expect(compareBar).toHaveAttribute('data-compare-path', '/compare')
  })

  it('renders BackToTop button within Suspense', async () => {
    render(<MainLayout />)
    // Lazy-loaded component wrapped in Suspense with fallback={null}
    const backToTop = await screen.findByTestId('back-to-top')
    expect(backToTop).toBeInTheDocument()
  })

  it('scrolls to top when scrollY is greater than 0', () => {
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true })
    render(<MainLayout />)
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' })
  })

  it('does not scroll when scrollY is 0', () => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    render(<MainLayout />)
    expect(window.scrollTo).not.toHaveBeenCalled()
  })
})
