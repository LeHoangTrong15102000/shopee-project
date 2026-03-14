import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import loyaltyApi from 'src/apis/loyalty.api';

export const LOYALTY_KEYS = {
  rewards: ['admin-rewards'] as const,
  transactions: ['admin-loyalty-tx'] as const,
  stats: ['admin-loyalty-stats'] as const,
};

export function useRewards() {
  return useQuery({
    queryKey: LOYALTY_KEYS.rewards,
    queryFn: () => loyaltyApi.getRewards().then((r) => r.data.data),
  });
}

export function useLoyaltyTransactions() {
  return useQuery({
    queryKey: LOYALTY_KEYS.transactions,
    queryFn: () => loyaltyApi.getTransactions().then((r) => r.data.data),
  });
}

export function useLoyaltyStats() {
  return useQuery({
    queryKey: LOYALTY_KEYS.stats,
    queryFn: () => loyaltyApi.getStats().then((r) => r.data.data),
  });
}

export function useCreateReward(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description: string; points_required: number }) =>
      loyaltyApi.createReward(body),
    onSuccess: () => {
      toast.success('Reward created');
      qc.invalidateQueries({ queryKey: LOYALTY_KEYS.rewards });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create reward'),
  });
}

export function useUpdateReward(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name: string; description: string; points_required: number };
    }) => loyaltyApi.updateReward(id, body),
    onSuccess: () => {
      toast.success('Reward updated');
      qc.invalidateQueries({ queryKey: LOYALTY_KEYS.rewards });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update reward'),
  });
}

export function useDeleteReward(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loyaltyApi.deleteReward(id),
    onSuccess: () => {
      toast.success('Reward deleted');
      qc.invalidateQueries({ queryKey: LOYALTY_KEYS.rewards });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete reward'),
  });
}

export function useAdjustPoints(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { user_id: string; points: number; description: string }) =>
      loyaltyApi.adjustPoints(body),
    onSuccess: () => {
      toast.success('Points adjusted');
      qc.invalidateQueries({ queryKey: LOYALTY_KEYS.transactions });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to adjust points'),
  });
}
