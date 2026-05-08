import { useQuery } from '@tanstack/react-query'
import { canReview } from '@/apis/review.api'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const canReviewKeys = {
  byPurchase: (purchaseId: string) => ['can-review', purchaseId] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCanReview(purchaseId: string) {
  return useQuery({
    queryKey: canReviewKeys.byPurchase(purchaseId),
    queryFn: () => canReview(purchaseId),
    enabled: !!purchaseId,
    staleTime: 1000 * 60 * 5,
  })
}
