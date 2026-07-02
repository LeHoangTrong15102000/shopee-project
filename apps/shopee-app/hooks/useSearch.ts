import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  searchProducts,
  getSearchSuggestions,
  getSearchHistory,
  saveSearchHistory,
  deleteHistoryItem,
  clearSearchHistory,
} from '@/apis/search.api'
import { useDebounce } from '@/hooks/useDebounce'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const searchKeys = {
  suggestions: (keyword: string) => ['search-suggestions', keyword] as const,
  history: () => ['search-history'] as const,
  results: (params: object) => ['search-results', params] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSearchProducts(params: {
  keyword: string
  sortBy?: string
  order?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  category?: string
  // NOTE: inStock is forwarded to the API as a query param. The backend may not
  // support this filter yet — if ignored server-side, the UI still reflects the
  // user's intent and the param is ready for when the backend adds support.
  inStock?: boolean
  enabled?: boolean
}) {
  const { enabled = true, ...searchParams } = params
  return useInfiniteQuery({
    queryKey: searchKeys.results(searchParams),
    queryFn: ({ pageParam }) =>
      searchProducts({ ...searchParams, page: pageParam as number, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.data.pagination
      return page < total_pages ? page + 1 : undefined
    },
    enabled: !!params.keyword && enabled,
  })
}

export function useSearchSuggestions(keyword: string) {
  const debouncedKeyword = useDebounce(keyword, 300)
  return useQuery({
    queryKey: searchKeys.suggestions(debouncedKeyword),
    queryFn: () => getSearchSuggestions(debouncedKeyword),
    enabled: !!debouncedKeyword && debouncedKeyword.length > 0,
    staleTime: 1000 * 30,
  })
}

export function useSearchHistory() {
  return useQuery({
    queryKey: searchKeys.history(),
    queryFn: getSearchHistory,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveSearchHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (keyword: string) => saveSearchHistory(keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.history() })
    },
  })
}

export function useDeleteHistoryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (keyword: string) => deleteHistoryItem(keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.history() })
    },
  })
}

export function useClearSearchHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clearSearchHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.history() })
    },
  })
}
