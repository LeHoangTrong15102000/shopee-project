import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendMessage } from '@/apis/chat.api'
import { useChatStore } from '@/store/chatStore'
import { Message } from '@/types/chat.type'
import { useAuthStore } from '@/store/authStore'

interface SendMessageParams {
  conversationId: string
  content: string
  type: 'text' | 'image'
  imageUrl?: string
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  const appendToBuffer = useChatStore((state) => state.appendToBuffer)
  const userId = useAuthStore((state) => state.user?._id ?? '')

  return useMutation({
    mutationFn: ({ conversationId, content, type, imageUrl }: SendMessageParams) =>
      sendMessage(conversationId, { content, type, imageUrl }),

    onMutate: async ({ conversationId, content, type, imageUrl }) => {
      // Optimistic message with temporary id
      const optimisticId = `optimistic-${Date.now()}`
      const optimistic: Message = {
        _id: optimisticId,
        conversationId,
        senderId: userId,
        senderType: 'user',
        content,
        type,
        imageUrl,
        status: 'sending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      appendToBuffer(conversationId, optimistic)
      return { optimisticId, conversationId }
    },

    onSuccess: (data, _vars, context) => {
      if (!context) return
      // Replace optimistic message with real one in buffer
      const store = useChatStore.getState()
      const buffer = store.messageBuffer[context.conversationId] ?? []
      const updated = buffer.map((m) =>
        m._id === context.optimisticId ? { ...data, status: 'sent' as const } : m,
      )
      useChatStore.setState((state) => ({
        messageBuffer: { ...state.messageBuffer, [context.conversationId]: updated },
      }))
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },

    onError: (_err, _vars, context) => {
      if (!context) return
      // Mark optimistic message as failed
      const store = useChatStore.getState()
      const buffer = store.messageBuffer[context.conversationId] ?? []
      const updated = buffer.map((m) =>
        m._id === context.optimisticId ? { ...m, status: 'failed' as const } : m,
      )
      useChatStore.setState((state) => ({
        messageBuffer: { ...state.messageBuffer, [context.conversationId]: updated },
      }))
    },
  })
}
