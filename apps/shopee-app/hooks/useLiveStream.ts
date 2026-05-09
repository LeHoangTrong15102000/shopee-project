import { useQuery } from '@tanstack/react-query'
import { getLiveStream } from '@/apis/live.api'

export function useLiveStream(id: string) {
  return useQuery({
    queryKey: ['live-stream', id],
    queryFn: () => getLiveStream(id),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds — live data changes frequently
  })
}
