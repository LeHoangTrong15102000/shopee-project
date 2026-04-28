import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createReview, type CreateReviewPayload } from '@/apis/review.api'
import { toast } from '@/utils/toast'

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReview(payload),
    onSuccess: () => {
      toast.success('Đánh giá đã được gửi')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => {
      toast.error('Không thể gửi đánh giá', 'Vui lòng thử lại sau')
    },
  })
}
