import { Purchase } from 'src/types/purchases.type'

/**
 * Normalize a sku id to a canonical form for comparison.
 * Absent, undefined, and null all represent "no variant" and are treated as equal.
 */
function normalizeSkuId(skuId: string | null | undefined): string | null {
  return skuId ?? null
}

/**
 * Compare two sku ids using the backend equality rule:
 * - null/undefined on both sides → equal (non-variant lines match each other)
 * - concrete id on one side, null/undefined on the other → not equal
 * - two concrete ids → equal only when the string values match
 */
export function skuIdsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeSkuId(a) === normalizeSkuId(b)
}

/**
 * Determine whether a cached cart line matches an incoming add-to-cart/update payload.
 * Two lines are the same cart line when product._id and sku._id are both equal,
 * where absent/null sku on both sides counts as equal.
 */
export function cartLineMatches(
  purchase: Purchase,
  productId: string,
  skuId: string | null | undefined,
): boolean {
  return purchase.product?._id === productId && skuIdsMatch(purchase.sku?._id, skuId)
}
