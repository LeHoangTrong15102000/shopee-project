import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import reviewsApi from 'src/apis/reviews.api'
import { useAdminMutationContext } from './useAdminMutationContext'

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
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (id: string) => reviewsApi.deleteReview(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.reviewDeleted', { ns: 'reviews' }))
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.all })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.deleteReviewFailed', { ns: 'reviews' }))
    },
  })
}
