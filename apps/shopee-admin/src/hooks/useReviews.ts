import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import reviewsApi from 'src/apis/reviews.api'
import { useActivityLogStore } from 'src/stores/activity-log.store'
import { useAuthStore } from 'src/stores/auth.store'

export const REVIEW_KEYS = {
  list: (page: number) => ['admin-reviews', page] as const,
  all: ['admin-reviews'] as const,
  stats: ['admin-review-stats'] as const,
}

export function useReviews(page: number) {
  return useQuery({
    queryKey: REVIEW_KEYS.list(page),
    queryFn: () => reviewsApi.getReviews({ page: page + 1, limit: 10 }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useReviewStats() {
  return useQuery({
    queryKey: REVIEW_KEYS.stats,
    queryFn: () => reviewsApi.getReviewStats().then((r) => r.data.data),
  })
}

export function useDeleteReview(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (id: string) => reviewsApi.deleteReview(id),
    onSuccess: (_, id) => {
      toast.success(i18n.t('toast.reviewDeleted', { ns: 'reviews' }))
      addLog({ action: 'delete', entityType: 'review', entityName: id, adminEmail: email })
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.deleteReviewFailed', { ns: 'reviews' })),
  })
}
