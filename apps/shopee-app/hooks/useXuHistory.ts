import { useInfiniteQuery } from '@tanstack/react-query'
import { getXuHistory } from '@/apis/xu.api'

const LIMIT = 20

export function useXuHistory() {
  return useInfiniteQuery({
    queryKey: ['xu-history'],
    queryFn: ({ pageParam }) => getXuHistory(pageParam as number, LIMIT),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / LIMIT)
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined
    },
  })
}
