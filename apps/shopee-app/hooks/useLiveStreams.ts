import { useQuery } from '@tanstack/react-query'
import { getLiveStreams } from '@/apis/live.api'

export function useLiveStreams() {
  return useQuery({
    queryKey: ['live-streams'],
    queryFn: getLiveStreams,
    staleTime: 1000 * 30, // 30 seconds — live data changes frequently
  })
}
