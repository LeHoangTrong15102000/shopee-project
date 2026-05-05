import { useQuery, keepPreviousData } from '@tanstack/react-query'
import conversationsApi from 'src/apis/conversations.api'

export const CONVERSATION_KEYS = {
  all: ['admin-conversations'] as const,
  list: (page: number) => ['admin-conversations', page] as const,
  detail: (id: string) => ['admin-conversations', id] as const,
}

export function useConversations(page = 1) {
  return useQuery({
    queryKey: CONVERSATION_KEYS.list(page),
    queryFn: () => conversationsApi.getConversations(page).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: CONVERSATION_KEYS.detail(id ?? ''),
    queryFn: () => conversationsApi.getConversation(id!).then((r) => r.data.data),
    enabled: !!id,
    retry: false,
  })
}
