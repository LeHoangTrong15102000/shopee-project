import { useQuery } from '@tanstack/react-query'
import { getBundles, getBundleDetail, getProductBundles } from '@/apis/bundles.api'

// 5-minute stale time — bundles change slowly
const BUNDLE_STALE_TIME = 5 * 60 * 1000

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export function useBundles() {
  return useQuery({
    queryKey: ['bundles'],
    queryFn: () => getBundles(),
    staleTime: BUNDLE_STALE_TIME,
  })
}

export function useBundleDetail(bundleId: string) {
  return useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => getBundleDetail(bundleId),
    enabled: !!bundleId,
    staleTime: BUNDLE_STALE_TIME,
  })
}

export function useProductBundles(productId: string) {
  return useQuery({
    queryKey: ['product', productId, 'bundles'],
    queryFn: () => getProductBundles(productId),
    enabled: !!productId,
    staleTime: BUNDLE_STALE_TIME,
  })
}
