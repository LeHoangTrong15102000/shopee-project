import React from 'react'
import { StripeProvider as NativeStripeProvider } from '@stripe/stripe-react-native'
import { STRIPE_PUBLISHABLE_KEY } from '@/config/env'

interface StripeProviderProps {
  children: React.ReactElement | React.ReactElement[]
}

/**
 * Wraps the app with @stripe/stripe-react-native StripeProvider.
 * Publishable key is read from EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY.
 * The urlScheme matches the app's existing deep link scheme so 3DS
 * browser flows can return to the app via shopeeapp://stripe-return.
 */
export default function StripeProvider({ children }: StripeProviderProps) {
  return (
    <NativeStripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.shopeeapp"
      urlScheme="shopeeapp">
      {children}
    </NativeStripeProvider>
  )
}
