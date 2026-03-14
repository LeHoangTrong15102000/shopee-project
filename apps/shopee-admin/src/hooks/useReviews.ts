import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import reviewsApi from 'src/apis/reviews.api';

export const REVIEW_KEYS = {
  list: (page: number) => ['admin-reviews', page] as const,
  all: ['admin-reviews'] as const,
  stats: ['admin-review-stats'] as const,
};

export function useReviews(page: number) {
  return useQuery({
    queryKey: REVIEW_KEYS.list(page),
    queryFn: () => reviewsApi.getReviews({ page: page + 1, limit: 10 }).then((r) => r.data.data),
  });
}

export function useReviewStats() {
  return useQuery({
    queryKey: REVIEW_KEYS.stats,
    queryFn: () => reviewsApi.getReviewStats().then((r) => r.data.data),
  });
}

export function useDeleteReview(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewsApi.deleteReview(id),
    onSuccess: () => {
      toast.success('Review deleted');
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete review'),
  });
}
