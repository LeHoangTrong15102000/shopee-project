import { useCart } from '@/hooks/useCart'

/**
 * Returns the total number of items in the cart (sum of buy_count across all
 * line items).  Returns `undefined` while the cart query is loading or has
 * errored, so consumers can distinguish "data not yet available" from "cart is
 * empty (0 items)".
 */
export function useCartCount(): number | undefined {
  const { data, isLoading, isError } = useCart()
  if (isLoading || isError) return undefined
  return data?.data?.reduce((sum, item) => sum + (item.buy_count ?? 1), 0) ?? 0
}
