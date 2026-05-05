import { useQuery } from '@tanstack/react-query'
import checkinApi from 'src/apis/checkin.api'

export const CHECKIN_KEYS = {
  stats: ['admin-checkin-stats'] as const,
}

export function useCheckinStats() {
  return useQuery({
    queryKey: CHECKIN_KEYS.stats,
    queryFn: () => checkinApi.getCheckinStats().then((r) => r.data.data),
    retry: false,
  })
}
