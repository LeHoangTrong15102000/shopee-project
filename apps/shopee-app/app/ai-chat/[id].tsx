import React, { useRef, useEffect, useState } from 'react'
import { View, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'
import { AppText } from '@/components/ui'
import { useConversation, useSendMessage, useUpdateConversation } from '@/hooks/useAiConversations'
import MessageBubble from '@/components/ai-chat/MessageBubble'
import TypingIndicator from '@/components/ai-chat/TypingIndicator'
import ChatInput from '@/components/ai-chat/ChatInput'
import { type Message } from '@/apis/ai-chat.api'

export default function AiChatScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const { id } = useLocalSearchParams<{ id: string }>()
  const flatListRef = useRef<FlatList<Message>>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')

  const { data: conversation, isLoading } = useConversation(id)
  const sendMessage = useSendMessage(id)
  const updateConversation = useUpdateConversation()

  useEffect(() => {
    if (conversation?.title) {
      setTitleInput(conversation.title)
    }
  }, [conversation?.title])

  useEffect(() => {
    if (conversation?.messages?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [conversation?.messages?.length])

  const handleSend = (message: string) => {
    sendMessage.mutate(message, {
      onSuccess: () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }, 100)
      },
    })
  }

  const handleTitlePress = () => {
    setIsEditingTitle(true)
  }

  const handleTitleSubmit = () => {
    const trimmed = titleInput.trim()
    if (trimmed && trimmed !== conversation?.title) {
      updateConversation.mutate({ id, title: trimmed })
    }
    setIsEditingTitle(false)
  }

  const messages = conversation?.messages ?? []

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () =>
            isEditingTitle ? (
              <TextInput
                value={titleInput}
                onChangeText={setTitleInput}
                onBlur={handleTitleSubmit}
                onSubmitEditing={handleTitleSubmit}
                autoFocus
                style={{
                  color: colors.foreground,
                  fontSize: 16,
                  fontWeight: '600',
                  minWidth: 150,
                  maxWidth: 220,
                }}
              />
            ) : (
              <TouchableOpacity
                onPress={handleTitlePress}
                accessibilityRole="button"
                accessibilityLabel={t('aiChat.chat.editTitle')}>
                <AppText
                  raw
                  variant="body"
                  weight="semibold"
                  numberOfLines={1}
                  style={{ maxWidth: 220 }}>
                  {conversation?.title || t('aiChat.header.title')}
                </AppText>
              </TouchableOpacity>
            ),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
            ListEmptyComponent={
              <View
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                <AppText raw variant="bodySmall" color="muted">
                  {t('aiChat.chat.emptyTitle')}
                </AppText>
              </View>
            }
            ListFooterComponent={sendMessage.isPending ? <TypingIndicator /> : null}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            }}
          />
        )}
        <ChatInput onSend={handleSend} isPending={sendMessage.isPending} />
      </SafeAreaView>
    </>
  )
}
