import React from 'react'
import { View, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { Conversation } from '@/types/chat.type'

interface ConversationItemProps {
  conversation: Conversation
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Hôm qua'
  } else if (diffDays < 7) {
    return `${diffDays} ngày`
  }
  return date.toLocaleDateString()
}

export default function ConversationItem({ conversation }: ConversationItemProps) {
  const colors = useColors()
  const router = useRouter()

  return (
    <TouchableOpacity
      className="flex-row items-center gap-3 px-4 py-3"
      onPress={() => router.push(`/chat/${conversation._id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${conversation.shopName ?? 'Shop'}`}>
      {/* Avatar */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.neutrals700,
          overflow: 'hidden',
        }}>
        {conversation.shopAvatar ? (
          <Image
            source={{ uri: conversation.shopAvatar }}
            style={{ width: '100%', height: '100%' }}
            accessibilityLabel={`${conversation.shopName} avatar`}
          />
        ) : null}
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <AppText raw variant="body" weight="semibold" numberOfLines={1} className="mr-2 flex-1">
            {conversation.shopName ?? 'Shop'}
          </AppText>
          <AppText raw variant="labelSmall" color="muted">
            {formatTime(conversation.updatedAt)}
          </AppText>
        </View>

        <View className="mt-0.5 flex-row items-center justify-between">
          <AppText raw variant="bodySmall" color="muted" numberOfLines={1} className="mr-2 flex-1">
            {conversation.lastMessage?.content ?? 'Bắt đầu cuộc trò chuyện'}
          </AppText>

          {conversation.unreadCount > 0 && (
            <View
              className="min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: colors.primary }}>
              <AppText
                raw
                variant="labelSmall"
                style={{ color: colors.primaryForeground, fontSize: 11 }}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}
