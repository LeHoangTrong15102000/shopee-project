import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLoyaltyRewards, redeemReward } from '@/apis/xu.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const loyaltyRewardKeys = {
  all: () => ['loyalty-rewards'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useLoyaltyRewards() {
  return useQuery({
    queryKey: loyaltyRewardKeys.all(),
    queryFn: getLoyaltyRewards,
    staleTime: 1000 * 60 * 5,
  })
}

export function useRedeemReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rewardId: string) => redeemReward(rewardId),
    onSuccess: () => {
      // Refresh xu points balance after redeem
      queryClient.invalidateQueries({ queryKey: ['xu-points'] })
      queryClient.invalidateQueries({ queryKey: loyaltyRewardKeys.all() })
    },
    onError: handleMutationError,
  })
}
