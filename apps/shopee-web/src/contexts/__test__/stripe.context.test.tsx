import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StripeProvider } from '../stripe.context'

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children, stripe, options }: any) => (
    <div
      data-testid="stripe-elements"
      data-locale={options?.locale}
      data-has-stripe={stripe !== null && stripe !== undefined ? 'true' : 'false'}
    >
      {children}
    </div>
  ),
  CardElement: ({ onChange, options }: any) => (
    <div data-testid="card-element" data-disabled={options?.disabled}>
      <input data-testid="card-input" onChange={onChange} />
    </div>
  ),
  useStripe: vi.fn(),
  useElements: vi.fn(),
}))

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() =>
    Promise.resolve({
      /* mock stripe instance */
    }),
  ),
}))

describe('StripeProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders children inside the Stripe Elements wrapper', () => {
    render(
      <StripeProvider>
        <div data-testid="child-content">Checkout Form</div>
      </StripeProvider>,
    )
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  it('wraps children with the stripe-elements container', () => {
    render(
      <StripeProvider>
        <span>test</span>
      </StripeProvider>,
    )
    expect(screen.getByTestId('stripe-elements')).toBeInTheDocument()
  })

  it('passes locale "vi" option to Elements', () => {
    render(
      <StripeProvider>
        <span>test</span>
      </StripeProvider>,
    )
    const elements = screen.getByTestId('stripe-elements')
    expect(elements.getAttribute('data-locale')).toBe('vi')
  })

  it('passes a stripe promise to Elements when a valid publishable key is set', () => {
    // The guard inside StripeProvider only calls loadStripe when the key looks
    // real (starts with "pk_" and is not the "pk_test_..." placeholder). Stub a
    // valid-looking key so the provider produces a non-null promise.
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_validkey123')
    render(
      <StripeProvider>
        <span>test</span>
      </StripeProvider>,
    )
    const elements = screen.getByTestId('stripe-elements')
    // The stripe prop is a Promise (not null), so data-has-stripe should be true
    expect(elements.getAttribute('data-has-stripe')).toBe('true')
  })

  it('passes stripe={null} to Elements when the key is the placeholder', () => {
    // "pk_test_..." is the placeholder shipped in .env. The guard must treat it
    // as missing and pass null so Stripe.js never fires a network request.
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_...')
    render(
      <StripeProvider>
        <span>test</span>
      </StripeProvider>,
    )
    const elements = screen.getByTestId('stripe-elements')
    expect(elements.getAttribute('data-has-stripe')).toBe('false')
  })

  it('renders multiple children correctly', () => {
    render(
      <StripeProvider>
        <div data-testid="first">First</div>
        <div data-testid="second">Second</div>
      </StripeProvider>,
    )
    expect(screen.getByTestId('first')).toBeInTheDocument()
    expect(screen.getByTestId('second')).toBeInTheDocument()
  })

  it('renders without crashing even when VITE_STRIPE_PUBLISHABLE_KEY is undefined in test env', () => {
    // In test environment, import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY is undefined.
    // The provider should still render children without throwing.
    render(
      <StripeProvider>
        <span data-testid="child">test</span>
      </StripeProvider>,
    )
    expect(screen.getByTestId('stripe-elements')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
