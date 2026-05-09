import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { Send } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'

interface ChatInputProps {
  onSend: (message: string) => void
  isPending: boolean
}

export default function ChatInput({ onSend, isPending }: ChatInputProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const [text, setText] = useState('')

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isPending) return
    onSend(trimmed)
    setText('')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: colors.neutrals800,
          backgroundColor: colors.background,
        }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('aiChat.chat.inputPlaceholder')}
          placeholderTextColor={colors.neutrals400}
          multiline
          maxLength={2000}
          editable={!isPending}
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            backgroundColor: colors.neutrals800,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: colors.foreground,
            fontSize: 14,
            marginRight: 8,
          }}
          accessibilityLabel={t('aiChat.chat.inputPlaceholder')}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || isPending}
          accessibilityRole="button"
          accessibilityLabel={t('aiChat.chat.send')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: !text.trim() || isPending ? colors.neutrals800 : colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Send size={18} color={!text.trim() || isPending ? colors.foreground : '#fff'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
