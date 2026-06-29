import { ExtendedPurchase } from 'src/types/purchases.type'

/**
 * Get the quantity of a specific product/variant already in the cart.
 *
 * When `skuId` is provided, only the matching variant line is counted (a
 * `null`/absent sku on the cart line matches a `null` skuId). When `skuId`
 * is omitted, the legacy product-only behavior is preserved so non-variant
 * callers keep working unchanged.
 *
 * Returns 0 if no matching line is found.
 */
export const getProductQuantityInCart = (
  productId: string,
  cartItems: ExtendedPurchase[],
  skuId?: string | null,
): number => {
  const item = cartItems.find((item) => {
    if (item.product._id !== productId) return false
    if (skuId === undefined) return true
    return (item.sku?._id ?? null) === (skuId ?? null)
  })
  return item ? item.buy_count : 0
}
