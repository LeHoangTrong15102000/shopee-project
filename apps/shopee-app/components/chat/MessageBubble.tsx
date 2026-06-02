import React from 'react'
import { View, Image, ActivityIndicator, TouchableOpacity } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { Message } from '@/types/chat.type'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  onRetry?: () => void
}

export default function MessageBubble({ message, isMine, onRetry }: MessageBubbleProps) {
  const colors = useColors()

  return (
    <View className={`mb-2 max-w-[75%] ${isMine ? 'self-end' : 'self-start'}`}>
      <View
        className="rounded-2xl px-3 py-2"
        style={{
          backgroundColor: isMine ? colors.primary : colors.neutrals800,
          borderBottomRightRadius: isMine ? 4 : 16,
          borderBottomLeftRadius: isMine ? 16 : 4,
        }}>
        {message.type === 'image' && message.imageUrl ? (
          <Image
            source={{ uri: message.imageUrl }}
            style={{ width: 200, height: 200, borderRadius: 8 }}
            resizeMode="cover"
            accessibilityLabel="Image message"
          />
        ) : (
          <AppText
            raw
            variant="bodySmall"
            style={{ color: isMine ? colors.primaryForeground : colors.foreground }}>
            {message.content}
          </AppText>
        )}
      </View>

      {/* Status indicator for own messages */}
      {isMine && (
        <View className="mt-0.5 flex-row items-center justify-end gap-1">
          {message.status === 'sending' && (
            <ActivityIndicator size={10} color={colors.neutrals400} />
          )}
          {message.status === 'failed' && (
            <TouchableOpacity
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Retry sending message"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AlertCircle size={12} color={colors.error} />
            </TouchableOpacity>
          )}
          <AppText raw variant="labelSmall" color="muted">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </AppText>
        </View>
      )}
    </View>
  )
}
