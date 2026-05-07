import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import conversationsApi, { type ConversationListParams } from 'src/apis/conversations.api'
import { useAdminMutationContext } from './useAdminMutationContext'

export const CONVERSATION_KEYS = {
  all: ['admin-conversations'] as const,
  list: (params: ConversationListParams) => ['admin-conversations', 'list', params] as const,
  detail: (id: string) => ['admin-conversations', id] as const,
}

export function useConversations(params?: ConversationListParams) {
  return useQuery({
    queryKey: CONVERSATION_KEYS.list(params ?? {}),
    queryFn: () => conversationsApi.getConversations(params).then((r) => r.data.data),
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

export function useDeleteConversation(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (id: string) => conversationsApi.deleteConversation(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.deleted', { ns: 'conversations' }))
      qc.invalidateQueries({ queryKey: CONVERSATION_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.deleteFailed', { ns: 'conversations' }))
    },
  })
}
