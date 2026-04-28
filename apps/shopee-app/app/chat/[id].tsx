import React, { useEffect, useRef } from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useMessages } from '@/hooks/useMessages'
import { useSendMessage } from '@/hooks/useSendMessage'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { Message } from '@/types/chat.type'

export default function ChatConversationScreen() {
  const colors = useColors()
  const { id } = useLocalSearchParams<{ id: string }>()
  const userId = useAuthStore((state) => state.user?._id ?? '')
  const flatListRef = useRef<FlatList<Message>>(null)
  const queryClient = useQueryClient()

  const { messages, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(id)
  const { mutate: send, isPending: isSending } = useSendMessage()

  const status = useChatStore((state) => state.status)
  const typingState = useChatStore((state) => state.typingState[id] ?? false)
  const lastReconnectedAt = useChatStore((state) => state.lastReconnectedAt)
  const joinConversation = useChatStore((state) => state.joinConversation)
  const leaveConversation = useChatStore((state) => state.leaveConversation)
  const markRead = useChatStore((state) => state.markRead)
  const sendTyping = useChatStore((state) => state.sendTyping)

  useEffect(() => {
    joinConversation(id)
    markRead(id)
    return () => leaveConversation(id)
  }, [id])

  // Re-fetch messages after reconnect to catch any delivered while disconnected
  useEffect(() => {
    if (lastReconnectedAt !== null) {
      queryClient.invalidateQueries({ queryKey: ['messages', id] })
    }
  }, [lastReconnectedAt])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages.length])

  const handleSend = (text: string) => {
    send({ conversationId: id, content: text, type: 'text' })
  }

  const handleRetry = (message: Message) => {
    send({ conversationId: id, content: message.content, type: message.type, imageUrl: message.imageUrl })
  }

  const handleTyping = () => {
    sendTyping(id)
  }

  const isReconnecting = status === 'reconnecting'

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Chat',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Reconnecting banner */}
        {isReconnecting && (
          <View
            className="items-center py-2"
            style={{ backgroundColor: colors.warning }}
            accessibilityLiveRegion="polite">
            <AppText raw variant="labelSmall" style={{ color: '#000' }}>
              Đang kết nối lại...
            </AppText>
          </View>
        )}

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={item.senderId === userId}
                onRetry={item.status === 'failed' ? () => handleRetry(item) : undefined}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              isFetchingNextPage ? (
                <View className="items-center py-2">
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            ListFooterComponent={
              typingState ? (
                <View className="mb-2 self-start">
                  <View
                    className="rounded-2xl px-3 py-2"
                    style={{ backgroundColor: colors.neutrals800 }}>
                    <AppText raw variant="labelSmall" color="muted">
                      Đang nhập...
                    </AppText>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        <ChatInput onSend={handleSend} onTyping={handleTyping} disabled={isSending} />
      </SafeAreaView>
    </>
  )
}
