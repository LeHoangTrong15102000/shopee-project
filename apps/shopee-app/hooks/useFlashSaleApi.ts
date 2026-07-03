import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getActiveFlashSale, getFlashSaleDetail, getFlashSaleProducts } from '@/apis/flashSale.api'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const flashSaleKeys = {
  active: () => ['flash-sales', 'active'] as const,
  detail: (id: string) => ['flash-sales', id] as const,
  products: (id: string) => ['flash-sales', id, 'products'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Returns the list of currently active flash sales. staleTime: 60 s. */
export function useActiveFlashSale() {
  return useQuery({
    queryKey: flashSaleKeys.active(),
    queryFn: getActiveFlashSale,
    staleTime: 60 * 1000,
  })
}

/** Returns detail for a single flash sale by id. */
export function useFlashSaleDetail(id: string) {
  return useQuery({
    queryKey: flashSaleKeys.detail(id),
    queryFn: () => getFlashSaleDetail(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

/** Returns flash-price products for a flash sale by id. */
export function useFlashSaleProducts(id: string) {
  return useQuery({
    queryKey: flashSaleKeys.products(id),
    queryFn: () => getFlashSaleProducts(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

/**
 * Returns a callback that refetches the active flash sale list.
 * Used by the countdown component when the timer reaches zero.
 */
export function useRefetchActiveFlashSale() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: flashSaleKeys.active() })
}
