import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { Trash2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

interface Notification {
  _id: string
  title: string
  content: string
  is_read: boolean
  createdAt: string
}

interface NotificationItemProps {
  item: Notification
  onPress: (id: string) => void
  onDelete: (id: string) => void
}

export default function NotificationItem({ item, onPress, onDelete }: NotificationItemProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const getRelativeTime = (dateStr: string): string => {
    const now = Date.now()
    const date = new Date(dateStr).getTime()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('notificationItem.time.justNow')
    if (minutes < 60) return t('notificationItem.time.minutesAgo', { minutes })
    if (hours < 24) return t('notificationItem.time.hoursAgo', { hours })
    if (days < 7) return t('notificationItem.time.daysAgo', { days })
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  const renderRightActions = () => (
    <TouchableOpacity
      onPress={() => onDelete(item._id)}
      className="items-center justify-center bg-error px-5"
      accessibilityRole="button"
      accessibilityLabel={t('a11y.deleteNotification')}>
      <Trash2 size={20} color={colors.primaryForeground} />
    </TouchableOpacity>
  )

  return (
    <Swipeable renderRightActions={renderRightActions} friction={2}>
      <TouchableOpacity
        onPress={() => onPress(item._id)}
        className="flex-row items-start gap-3 bg-background px-4 py-3">
        {/* Unread indicator */}
        <View style={{ paddingTop: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: item.is_read ? 'transparent' : colors.secondary,
            }}
          />
        </View>

        <View className="flex-1">
          <AppText
            raw
            variant="body"
            weight={item.is_read ? 'regular' : 'semibold'}
            numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText
            raw
            variant="bodySmall"
            color="muted"
            numberOfLines={2}
            style={{ marginTop: 2 }}>
            {item.content}
          </AppText>
          <AppText raw variant="labelSmall" color="muted" style={{ marginTop: 4 }}>
            {getRelativeTime(item.createdAt)}
          </AppText>
        </View>
      </TouchableOpacity>
    </Swipeable>
  )
}
