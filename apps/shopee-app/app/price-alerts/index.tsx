import React, { useCallback } from 'react'
import { View, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { BellDot, Trash2 } from 'lucide-react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { useTranslation } from 'react-i18next'
import { AppText, EmptyState } from '@/components/ui'
import AppImage from '@/components/ui/AppImage'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { useColors } from '@/hooks/useColors'
import { usePriceAlerts, useDeletePriceAlert } from '@/hooks/usePriceAlerts'
import { PriceAlert } from '@/apis/price-alerts.api'
import { formatPrice } from '@/utils/price'

function PriceAlertSkeletonList() {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 16 }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SkeletonLoader width={60} height={60} borderRadius={8} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonLoader width="85%" height={14} borderRadius={4} />
            <SkeletonLoader width="60%" height={12} borderRadius={4} />
          </View>
          <SkeletonLoader width={60} height={22} borderRadius={12} />
        </View>
      ))}
    </View>
  )
}

function StatusBadge({ status }: { status: 'active' | 'triggered' }) {
  const { t } = useTranslation()
  const colors = useColors()
  const isActive = status === 'active'
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: isActive ? `${colors.success}20` : `${colors.warning}20`,
      }}
      accessibilityLabel={
        isActive ? t('priceAlerts.status.active') : t('priceAlerts.status.triggered')
      }>
      <AppText
        raw
        variant="labelSmall"
        style={{ color: isActive ? colors.success : colors.warning }}>
        {isActive ? t('priceAlerts.status.active') : t('priceAlerts.status.triggered')}
      </AppText>
    </View>
  )
}

export default function PriceAlertsScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()

  const { data: alerts, isLoading, isRefetching, refetch } = usePriceAlerts()
  const deleteAlert = useDeletePriceAlert()

  const handleDelete = useCallback(
    (alertId: string) => {
      deleteAlert.mutate(alertId)
    },
    [deleteAlert]
  )

  const renderRightActions = useCallback(
    (alertId: string) => (
      <TouchableOpacity
        onPress={() => handleDelete(alertId)}
        accessibilityRole="button"
        accessibilityLabel={t('priceAlerts.list.deleteAction')}
        style={{
          backgroundColor: colors.error,
          justifyContent: 'center',
          alignItems: 'center',
          width: 72,
        }}>
        <Trash2 size={20} color="#fff" />
        <AppText raw variant="labelSmall" style={{ color: '#fff', marginTop: 4 }}>
          {t('priceAlerts.list.deleteAction')}
        </AppText>
      </TouchableOpacity>
    ),
    [handleDelete, colors.error, t]
  )

  const renderItem = useCallback(
    ({ item }: { item: PriceAlert }) => (
      <Swipeable renderRightActions={() => renderRightActions(item._id)} overshootRight={false}>
        <TouchableOpacity
          onPress={() => router.push(`/product/${item.productId}`)}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.background,
            gap: 12,
          }}>
          <AppImage
            source={{ uri: item.productImage }}
            style={{ width: 60, height: 60, borderRadius: 8 }}
            contentFit="cover"
          />
          <View style={{ flex: 1, gap: 4 }}>
            <AppText raw variant="bodySmall" numberOfLines={2}>
              {item.productName}
            </AppText>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View>
                <AppText raw variant="labelSmall" color="muted">
                  {t('priceAlerts.list.currentPrice')}
                </AppText>
                <AppText raw variant="bodySmall" weight="semibold">
                  {formatPrice(item.currentPrice)}
                </AppText>
              </View>
              <View>
                <AppText raw variant="labelSmall" color="muted">
                  {t('priceAlerts.list.targetPrice')}
                </AppText>
                <AppText raw variant="bodySmall" weight="semibold" color="primary">
                  {formatPrice(item.targetPrice)}
                </AppText>
              </View>
            </View>
          </View>
          <StatusBadge status={item.status} />
        </TouchableOpacity>
      </Swipeable>
    ),
    [colors.background, router, renderRightActions, t]
  )

  return (
    <>
      <Stack.Screen options={{ title: t('priceAlerts.header.title') }} />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading ? (
          <PriceAlertSkeletonList />
        ) : (
          <FlatList
            data={alerts ?? []}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => (
              <View
                style={{ height: 1, marginHorizontal: 16, backgroundColor: colors.neutrals800 }}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                <EmptyState
                  icon={BellDot}
                  message={t('priceAlerts.list.emptyTitle')}
                  actionLabel={t('priceAlerts.list.emptySubtitle')}
                />
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  )
}
