import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import type { ReactNode } from 'react'

// loadStripe is called once at module level — the promise is memoized by the Stripe SDK.
// The Stripe.js script only loads when this component is mounted (i.e. on the checkout page).
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

interface StripeProviderProps {
  children: ReactNode
}

/**
 * Wraps children with the Stripe Elements context.
 *
 * Mount this around the Checkout page only — Stripe.js lazy-loads on first mount,
 * so it won't be fetched on any other page.
 */
export function StripeProvider({ children }: StripeProviderProps) {
  return (
    <Elements stripe={stripePromise} options={{ locale: 'vi' }}>
      {children}
    </Elements>
  )
}
