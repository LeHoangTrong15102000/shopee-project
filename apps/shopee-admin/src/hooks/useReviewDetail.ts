import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import reviewsApi from 'src/apis/reviews.api'
import { useActivityLogStore } from 'src/stores/activity-log.store'
import { useAuthStore } from 'src/stores/auth.store'

export const REVIEW_DETAIL_KEYS = {
  detail: (id: string) => ['admin-review', id] as const,
}

export function useReviewDetail(id: string | undefined) {
  return useQuery({
    queryKey: REVIEW_DETAIL_KEYS.detail(id!),
    queryFn: () => reviewsApi.getReview(id!).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useDeleteComment(id: string | undefined, onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (commentId: string) => reviewsApi.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      toast.success(i18n.t('toast.commentDeleted', { ns: 'reviews' }))
      addLog({ action: 'delete', entityType: 'comment', entityName: commentId, adminEmail: email })
      qc.invalidateQueries({ queryKey: REVIEW_DETAIL_KEYS.detail(id!) })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.deleteCommentFailed', { ns: 'reviews' })),
  })
}
