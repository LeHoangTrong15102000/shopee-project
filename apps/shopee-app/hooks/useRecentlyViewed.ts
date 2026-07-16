import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { recordProductView, getRecentlyViewed } from '@/apis/product.api'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const recentlyViewedKeys = {
  list: () => ['recently-viewed'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated user's recently-viewed products from the server.
 * Returns an empty array when the user is not authenticated or on error.
 */
export function useRecentlyViewed() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: recentlyViewedKeys.list(),
    queryFn: getRecentlyViewed,
    enabled: isAuthenticated,
    // Fail silently — the rail hides on empty/error
    throwOnError: false,
  })
}

/**
 * Fire-and-forget mutation: record a product view on the server.
 * Only fires for authenticated users; errors are swallowed so a failed
 * view never affects product detail.
 */
export function useRecordProductView() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useMutation({
    mutationFn: (productId: string) => {
      if (!isAuthenticated) {
        // Guests skip recording; resolve immediately without a network call
        return Promise.resolve()
      }
      return recordProductView(productId)
    },
    // Intentionally no onError — swallow silently per design decision 2
  })
}
