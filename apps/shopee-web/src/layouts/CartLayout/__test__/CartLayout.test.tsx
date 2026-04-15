import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CartLayout from '../CartLayout'

// Mock components
vi.mock('src/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}))

vi.mock('src/components/CartHeader', () => ({
  default: ({ title, showStepper }: { title?: string; showStepper?: boolean }) => (
    <header data-testid="cart-header" data-title={title} data-show-stepper={showStepper}>
      Cart Header {title && `- ${title}`}
    </header>
  ),
}))

vi.mock('src/components/PageTransition', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
}))

vi.mock('src/components/BackToTop', () => ({
  default: () => <button data-testid="back-to-top">Back to Top</button>,
}))

describe('CartLayout', () => {
  it('renders without crashing', () => {
    render(
      <CartLayout>
        <div>Content</div>
      </CartLayout>,
    )
    expect(screen.getByTestId('cart-header')).toBeInTheDocument()
  })

  it('contains CartHeader component', () => {
    render(
      <CartLayout>
        <div>Content</div>
      </CartLayout>,
    )
    const header = screen.getByTestId('cart-header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveTextContent('Cart Header')
  })

  it('contains Footer component', () => {
    render(
      <CartLayout>
        <div>Content</div>
      </CartLayout>,
    )
    const footer = screen.getByTestId('footer')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveTextContent('Footer')
  })

  it('wraps children in PageTransition component', () => {
    render(
      <CartLayout>
        <div data-testid="child-content">Child Content</div>
      </CartLayout>,
    )
    expect(screen.getByTestId('page-transition')).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  it('has correct layout structure with min-h-screen and background classes', () => {
    const { container } = render(
      <CartLayout>
        <div>Content</div>
      </CartLayout>,
    )
    const layoutDiv = container.firstChild as HTMLElement
    expect(layoutDiv).toHaveClass('min-h-screen', 'bg-gray-100', 'dark:bg-slate-900')
  })

  it('renders children content', () => {
    render(
      <CartLayout>
        <div data-testid="custom-child">Custom Cart Content</div>
      </CartLayout>,
    )
    expect(screen.getByTestId('custom-child')).toBeInTheDocument()
    expect(screen.getByTestId('custom-child')).toHaveTextContent('Custom Cart Content')
  })

  it('renders BackToTop button within Suspense', async () => {
    render(
      <CartLayout>
        <div>Content</div>
      </CartLayout>,
    )
    // Lazy-loaded component wrapped in Suspense with fallback={null}
    const backToTop = await screen.findByTestId('back-to-top')
    expect(backToTop).toBeInTheDocument()
  })

  it('passes headerTitle prop to CartHeader', () => {
    render(
      <CartLayout headerTitle="Shopping Cart">
        <div>Content</div>
      </CartLayout>,
    )
    const header = screen.getByTestId('cart-header')
    expect(header).toHaveAttribute('data-title', 'Shopping Cart')
    expect(header).toHaveTextContent('Cart Header - Shopping Cart')
  })

  it('passes showStepper prop to CartHeader with default value true', () => {
    render(
      <CartLayout>
        <div>Content</div>
      </CartLayout>,
    )
    const header = screen.getByTestId('cart-header')
    expect(header).toHaveAttribute('data-show-stepper', 'true')
  })

  it('passes showStepper prop to CartHeader when explicitly set to false', () => {
    render(
      <CartLayout showStepper={false}>
        <div>Content</div>
      </CartLayout>,
    )
    const header = screen.getByTestId('cart-header')
    expect(header).toHaveAttribute('data-show-stepper', 'false')
  })

  it('passes both headerTitle and showStepper props correctly', () => {
    render(
      <CartLayout headerTitle="Checkout" showStepper={false}>
        <div>Content</div>
      </CartLayout>,
    )
    const header = screen.getByTestId('cart-header')
    expect(header).toHaveAttribute('data-title', 'Checkout')
    expect(header).toHaveAttribute('data-show-stepper', 'false')
  })
})
