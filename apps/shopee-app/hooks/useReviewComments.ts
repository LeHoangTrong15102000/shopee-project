import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReviewComments, postReviewComment } from '@/apis/review.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const reviewCommentKeys = {
  byReview: (reviewId: string) => ['review-comments', reviewId] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useReviewComments(reviewId: string) {
  return useQuery({
    queryKey: reviewCommentKeys.byReview(reviewId),
    queryFn: () => getReviewComments(reviewId),
    enabled: !!reviewId,
    staleTime: 1000 * 60 * 2,
  })
}

export function usePostReviewComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, content }: { reviewId: string; content: string }) =>
      postReviewComment(reviewId, content),
    onSuccess: (_data, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: reviewCommentKeys.byReview(reviewId) })
    },
    onError: handleMutationError,
  })
}
