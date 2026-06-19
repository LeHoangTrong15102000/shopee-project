import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { useMemo, type ReactNode } from 'react'

interface StripeProviderProps {
  children: ReactNode
}

/**
 * Wraps children with the Stripe Elements context.
 *
 * Mount this around the Checkout page only. loadStripe is invoked lazily inside
 * the component (via useMemo) so the Stripe.js script is fetched only when this
 * provider actually mounts — never on app boot or on other pages. When the
 * publishable key is missing/placeholder we pass stripe={null} to Elements,
 * which renders children without firing a request to m.stripe.com or throwing
 * an IntegrationError.
 */
export function StripeProvider({ children }: StripeProviderProps) {
  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    if (!key || key.startsWith('pk_test_...') || !key.startsWith('pk_')) {
      return null
    }
    return loadStripe(key)
  }, [])

  return (
    <Elements stripe={stripePromise} options={{ locale: 'vi' }}>
      {children}
    </Elements>
  )
}
