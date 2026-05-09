import React, { useCallback } from 'react'
import { View, TouchableOpacity, Alert } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import Markdown from 'react-native-markdown-display'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'
import { AppText } from '@/components/ui'
import { type Message } from '@/apis/ai-chat.api'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const isUser = message.role === 'user'

  const handleLongPress = useCallback(() => {
    Clipboard.setStringAsync(message.content).then(() => {
      Alert.alert('', t('aiChat.chat.copySuccess'))
    })
  }, [message.content, t])

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isUser) {
    return (
      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        accessibilityRole="text"
        accessibilityLabel={message.content}
        style={{ alignSelf: 'flex-end', maxWidth: '80%', marginVertical: 4, marginHorizontal: 12 }}>
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 18,
            borderBottomRightRadius: 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}>
          <AppText raw variant="body" style={{ color: '#fff' }}>
            {message.content}
          </AppText>
        </View>
        <AppText raw variant="labelSmall" color="muted" style={{ alignSelf: 'flex-end', marginTop: 2 }}>
          {formattedTime}
        </AppText>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      activeOpacity={0.8}
      accessibilityRole="text"
      accessibilityLabel={message.content}
      style={{ alignSelf: 'flex-start', maxWidth: '80%', marginVertical: 4, marginHorizontal: 12 }}>
      <View
        style={{
          backgroundColor: colors.neutrals800,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}>
        <Markdown
          style={{
            body: { color: colors.foreground, fontSize: 14, lineHeight: 20 },
            code_inline: {
              backgroundColor: colors.neutrals700 ?? colors.neutrals800,
              color: colors.primary,
              borderRadius: 4,
              paddingHorizontal: 4,
            },
            fence: {
              backgroundColor: colors.neutrals700 ?? colors.neutrals800,
              borderRadius: 8,
              padding: 8,
            },
            code_block: {
              backgroundColor: colors.neutrals700 ?? colors.neutrals800,
              borderRadius: 8,
              padding: 8,
            },
            strong: { color: colors.foreground },
            em: { color: colors.foreground },
            bullet_list: { color: colors.foreground },
            ordered_list: { color: colors.foreground },
          }}>
          {message.content}
        </Markdown>
      </View>
      <AppText raw variant="labelSmall" color="muted" style={{ marginTop: 2 }}>
        {formattedTime}
      </AppText>
    </TouchableOpacity>
  )
}
