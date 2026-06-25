import { useState } from 'react'
import { CardElement } from '@stripe/react-stripe-js'
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js'

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151', // gray-700
      fontFamily: '"Inter", system-ui, sans-serif',
      '::placeholder': {
        color: '#9ca3af', // gray-400
      },
      iconColor: '#ee4d2d', // Shopee orange
    },
    invalid: {
      color: '#ef4444', // red-500
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true, // not relevant for VN
}

interface StripeCardFormProps {
  disabled?: boolean
  onError?: (error: string | null) => void
  onValidityChange?: (complete: boolean) => void
}

/**
 * Renders a Stripe CardElement with Shopee-styled border and inline validation.
 *
 * No forwardRef or useImperativeHandle needed — useCheckout.ts accesses the card
 * element directly via useElements().getElement(CardElement).
 */
export function StripeCardForm({
  disabled = false,
  onError,
  onValidityChange,
}: StripeCardFormProps) {
  const [cardError, setCardError] = useState<string | null>(null)

  const handleChange = (event: StripeCardElementChangeEvent) => {
    const error = event.error?.message ?? null
    setCardError(error)
    onError?.(error)
    onValidityChange?.(event.complete)
  }

  return (
    <div className="space-y-2">
      <div
        className="rounded-lg border border-gray-300 bg-white px-4 py-3 transition-colors focus-within:border-orange dark:border-slate-600 dark:bg-slate-800"
        aria-label="Card details"
      >
        <CardElement options={{ ...CARD_ELEMENT_OPTIONS, disabled }} onChange={handleChange} />
      </div>
      {cardError && (
        <p className="text-sm text-red-500" role="alert">
          {cardError}
        </p>
      )}
    </div>
  )
}

StripeCardForm.displayName = 'StripeCardForm'
