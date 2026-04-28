import React, { useCallback } from 'react'
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bell } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllRead,
  useDeleteNotification,
} from '@/hooks/useNotifications'
import NotificationItem from '@/components/notifications/NotificationItem'
import NotificationSkeleton from '@/components/notifications/NotificationSkeleton'

export default function NotificationsScreen() {
  const { t } = useTranslation()
  const colors = useColors()

  const { data, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications()

  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: markAllRead } = useMarkAllRead()
  const { mutate: deleteNotification } = useDeleteNotification()

  const allNotifications = data?.pages.flatMap((p) => p.data.notifications) ?? []

  const handlePress = useCallback(
    (id: string) => {
      markAsRead(id)
    },
    [markAsRead]
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteNotification(id)
    },
    [deleteNotification]
  )

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="border-b border-neutrals900 px-4 py-4">
          <AppText variant="heading2">{t('notifications.header.title')}</AppText>
        </View>
        <NotificationSkeleton />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between border-b border-neutrals900 px-4 py-4">
        <AppText raw variant="heading2">
          {t('notifications.header.title')}
        </AppText>
        {allNotifications.some((n) => !n.is_read) && (
          <TouchableOpacity onPress={() => markAllRead()}>
            <AppText raw variant="bodySmall" color="primary">
              {t('notifications.button.markAllRead')}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {allNotifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <EmptyState icon={Bell} message={t('notifications.empty.message')} />
        </View>
      ) : (
        <FlatList
          data={allNotifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={handlePress} onDelete={handleDelete} />
          )}
          ItemSeparatorComponent={() => <View className="h-px bg-neutrals900" />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  )
}

