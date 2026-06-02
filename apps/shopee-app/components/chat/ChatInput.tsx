import React, { useState, useRef, useCallback } from 'react'
import { View, TextInput, TouchableOpacity } from 'react-native'
import { Send, Image as ImageIcon } from 'lucide-react-native'
import { useColors } from '@/hooks/useColors'

interface ChatInputProps {
  onSend: (text: string) => void
  onTyping?: () => void
  disabled?: boolean
}

const TYPING_DEBOUNCE_MS = 2000

export default function ChatInput({ onSend, onTyping, disabled }: ChatInputProps) {
  const colors = useColors()
  const [text, setText] = useState('')
  const lastTypingRef = useRef<number>(0)

  const handleChangeText = useCallback(
    (value: string) => {
      setText(value)
      if (onTyping) {
        const now = Date.now()
        if (now - lastTypingRef.current > TYPING_DEBOUNCE_MS) {
          lastTypingRef.current = now
          onTyping()
        }
      }
    },
    [onTyping]
  )

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  return (
    <View
      className="flex-row items-end gap-2 border-t px-3 py-2"
      style={{ borderColor: colors.neutrals700, backgroundColor: colors.background }}>
      <TouchableOpacity
        className="mb-1 p-1"
        accessibilityRole="button"
        accessibilityLabel="Attach image">
        <ImageIcon size={22} color={colors.neutrals400} />
      </TouchableOpacity>

      <TextInput
        value={text}
        onChangeText={handleChangeText}
        placeholder="Nhập tin nhắn..."
        placeholderTextColor={colors.neutrals400}
        multiline
        maxLength={1000}
        style={{
          flex: 1,
          maxHeight: 100,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: colors.neutrals800,
          color: colors.foreground,
          fontSize: 14,
        }}
        accessibilityLabel="Message input"
      />

      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        className="mb-1 rounded-full p-2"
        style={{
          backgroundColor: text.trim() && !disabled ? colors.primary : colors.neutrals700,
        }}
        accessibilityRole="button"
        accessibilityLabel="Send message">
        <Send size={18} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  )
}
