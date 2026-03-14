import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import reviewsApi from 'src/apis/reviews.api';

export const REVIEW_DETAIL_KEYS = {
  detail: (id: string) => ['admin-review', id] as const,
};

export function useReviewDetail(id: string | undefined) {
  return useQuery({
    queryKey: REVIEW_DETAIL_KEYS.detail(id!),
    queryFn: () => reviewsApi.getReview(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useDeleteComment(id: string | undefined, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => reviewsApi.deleteComment(commentId),
    onSuccess: () => {
      toast.success('Comment deleted');
      qc.invalidateQueries({ queryKey: REVIEW_DETAIL_KEYS.detail(id!) });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete comment'),
  });
}
