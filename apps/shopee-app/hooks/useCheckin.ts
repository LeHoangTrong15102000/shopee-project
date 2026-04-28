import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCheckinStreak, checkIn } from '@/apis/checkin.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const checkinKeys = {
  streak: () => ['checkin-streak'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCheckinStreak() {
  return useQuery({
    queryKey: checkinKeys.streak(),
    queryFn: getCheckinStreak,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkinKeys.streak() })
    },
    onError: handleMutationError,
  })
}
