import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  updateConversation,
  deleteConversation,
  type Message,
} from '@/apis/ai-chat.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const conversationKeys = {
  all: ['ai-conversations'] as const,
  detail: (id: string) => ['ai-conversation', id] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAiConversations() {
  return useQuery({
    queryKey: conversationKeys.all,
    queryFn: getConversations,
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () => getConversation(id),
    enabled: !!id,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ message, title }: { message: string; title?: string }) =>
      createConversation(message, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.all })
    },
    onError: handleMutationError,
  })
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (message: string) => sendMessage(conversationId, message),
    onMutate: async (message: string) => {
      await queryClient.cancelQueries({ queryKey: conversationKeys.detail(conversationId) })
      const previous = queryClient.getQueryData(conversationKeys.detail(conversationId))
      queryClient.setQueryData(
        conversationKeys.detail(conversationId),
        (old: { messages: Message[] } | undefined) => {
          if (!old) return old
          const optimisticMessage: Message = {
            _id: `optimistic-${Date.now()}`,
            role: 'user',
            content: message,
            createdAt: new Date().toISOString(),
          }
          return { ...old, messages: [...old.messages, optimisticMessage] }
        }
      )
      return { previous }
    },
    onError: (err, _message, context) => {
      if (context?.previous) {
        queryClient.setQueryData(conversationKeys.detail(conversationId), context.previous)
      }
      handleMutationError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) })
      queryClient.invalidateQueries({ queryKey: conversationKeys.all })
    },
  })
}

export function useUpdateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateConversation(id, title),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.all })
      queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) })
    },
    onError: handleMutationError,
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.all })
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) })
    },
    onError: handleMutationError,
  })
}
