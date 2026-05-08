import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { getCheckinStreak, checkIn, getCheckinHistory } from '@/apis/checkin.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const checkinKeys = {
  streak: () => ['checkin-streak'] as const,
  history: () => ['checkin-history'] as const,
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
      queryClient.invalidateQueries({ queryKey: checkinKeys.history() })
    },
    onError: handleMutationError,
  })
}

export function useCheckinHistory() {
  return useInfiniteQuery({
    queryKey: checkinKeys.history(),
    queryFn: ({ pageParam = 1 }) => getCheckinHistory(pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.data.pagination
      const hasMore = page * limit < total
      return hasMore ? page + 1 : undefined
    },
    staleTime: 1000 * 60 * 5,
  })
}
