import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import reviewsApi from 'src/apis/reviews.api'
import type { ModerationStatus } from 'src/apis/reviews.api'
import { useAdminMutationContext } from './useAdminMutationContext'

export const REVIEW_KEYS = {
  list: (params: object) => ['admin-reviews', params] as const,
  all: ['admin-reviews'] as const,
  stats: ['admin-review-stats'] as const,
}

export function useReviews(params?: {
  page?: number
  limit?: number
  moderation_status?: ModerationStatus
  search?: string
}) {
  return useQuery({
    queryKey: REVIEW_KEYS.list(params ?? {}),
    queryFn: () =>
      reviewsApi
        .getReviews({ page: (params?.page ?? 0) + 1, limit: 10, ...params })
        .then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useReviewStats() {
  return useQuery({
    queryKey: REVIEW_KEYS.stats,
    queryFn: () => reviewsApi.getReviewStats().then((r) => r.data.data),
  })
}

export function useModerateReview(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ModerationStatus }) =>
      reviewsApi.moderateReview(id, status),
    onSuccess: (_data, { status }) => {
      if (status === 'approved') {
        toast.success(i18n.t('toast.approved', { ns: 'reviews' }))
      } else if (status === 'flagged') {
        toast.success(i18n.t('toast.flagged', { ns: 'reviews' }))
      } else {
        toast.success(i18n.t('toast.resetPending', { ns: 'reviews' }))
      }
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.moderateFailed', { ns: 'reviews' }))
    },
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
