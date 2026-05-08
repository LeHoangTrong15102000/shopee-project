import { useMutation, useQueryClient } from '@tanstack/react-query'
import { editReview, deleteReview, type EditReviewPayload } from '@/apis/review.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useEditReview(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: string; payload: EditReviewPayload }) =>
      editReview(reviewId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
    },
    onError: handleMutationError,
  })
}

export function useDeleteReview(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
    },
    onError: handleMutationError,
  })
}
