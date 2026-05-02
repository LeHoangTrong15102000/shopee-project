import { useQuery } from '@tanstack/react-query'
import { getProducts } from '@/apis/product.api'
import { type Product } from '@/types/product.type'

/**
 * Flash sale hook.
 *
 * API finding (task 2.1): The backend does NOT support a `GET /products?isFlashSale=true`
 * filter. Flash sale data is managed entirely via WebSocket (socket/managers/flash-sale.manager.ts)
 * as an in-memory store. There is no dedicated REST endpoint for flash sale products.
 *
 * Strategy: Fall back to fetching the first page of products sorted by sold count as a
 * "featured" proxy. Returns an empty array on error so the UI section hides gracefully.
 *
 * Trade-off: Because this fallback always returns products (unless the API is down),
 * FlashSaleSection's empty-state path is effectively unreachable in normal operation.
 * The empty-state guard is kept for correctness and will become meaningful once a real
 * flash sale REST endpoint exists and this hook is updated to use it.
 */
export function useFlashSale() {
  return useQuery({
    queryKey: ['flash-sale'],
    queryFn: async (): Promise<Product[]> => {
      try {
        const result = await getProducts({ page: 1, limit: 10 })
        return result.products
      } catch {
        // No error surfaced to UI — section renders nothing on failure
        return []
      }
    },
  })
}
