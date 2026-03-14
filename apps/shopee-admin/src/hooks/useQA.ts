import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import qaApi from 'src/apis/qa.api';

export const QA_KEYS = {
  all: ['admin-qa'] as const,
  stats: ['admin-qa-stats'] as const,
};

export function useQuestions() {
  return useQuery({
    queryKey: QA_KEYS.all,
    queryFn: () => qaApi.getQuestions({ limit: 50 }).then((r) => r.data.data),
  });
}

export function useQAStats() {
  return useQuery({
    queryKey: QA_KEYS.stats,
    queryFn: () => qaApi.getQAStats().then((r) => r.data.data),
  });
}

export function useDeleteQuestion(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qaApi.deleteQuestion(id),
    onSuccess: () => {
      toast.success('Question deleted');
      qc.invalidateQueries({ queryKey: QA_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete question'),
  });
}

export function useDeleteAnswer(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qId, aId }: { qId: string; aId: string }) => qaApi.deleteAnswer(qId, aId),
    onSuccess: () => {
      toast.success('Answer deleted');
      qc.invalidateQueries({ queryKey: QA_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete answer'),
  });
}
