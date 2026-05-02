import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createReview, type CreateReviewPayload } from '@/apis/review.api'
import { toast } from '@/utils/toast'
import { orderKeys } from '@/hooks/useOrders'

export function useSubmitShopReview() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReview(payload),
    onSuccess: () => {
      toast.success(t('review.toast.success'))
      queryClient.invalidateQueries({ queryKey: orderKeys.all() })
    },
    onError: () => {
      toast.error(t('review.toast.error'), t('errors.genericMessage'))
    },
  })
}
