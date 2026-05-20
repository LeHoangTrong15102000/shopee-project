// API configuration
// Override via environment variable or Expo config extra field
// Default: production API URL
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api-ecom.duthanhduoc.com/'

// Stripe publishable key — set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
