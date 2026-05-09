import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { Trash2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'
import { AppText } from '@/components/ui'
import { type Conversation } from '@/apis/ai-chat.api'

interface ConversationListItemProps {
  conversation: Conversation
  onPress: () => void
  onDelete: () => void
}

export default function ConversationListItem({
  conversation,
  onPress,
  onDelete,
}: ConversationListItemProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const formattedDate = new Date(conversation.updatedAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })

  const renderRightActions = () => (
    <TouchableOpacity
      onPress={onDelete}
      accessibilityRole="button"
      accessibilityLabel={t('aiChat.list.deleteAction')}
      style={{
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        width: 72,
      }}>
      <Trash2 size={20} color="#fff" />
    </TouchableOpacity>
  )

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: colors.background,
        }}>
        <View style={{ flex: 1 }}>
          <AppText raw variant="body" weight="semibold" numberOfLines={1}>
            {conversation.title || t('aiChat.header.title')}
          </AppText>
          {conversation.lastMessage ? (
            <AppText raw variant="bodySmall" color="muted" numberOfLines={1} style={{ marginTop: 2 }}>
              {conversation.lastMessage}
            </AppText>
          ) : null}
        </View>
        <AppText raw variant="labelSmall" color="muted" style={{ marginLeft: 8 }}>
          {formattedDate}
        </AppText>
      </TouchableOpacity>
    </Swipeable>
  )
}
