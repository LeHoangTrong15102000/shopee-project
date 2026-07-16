import React from 'react'
import { View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { FileQuestion } from 'lucide-react-native'
import { AppText } from '@/components/ui'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { useColors } from '@/hooks/useColors'
import { useMyRefunds } from '@/hooks/useRefund'
import { type Refund, type RefundStatus } from '@/apis/refund.api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'

const STATUS_BADGE: Record<RefundStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'primary',
  REJECTED: 'error',
  PROCESSING: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'default',
}

// ─── Refund Card ──────────────────────────────────────────────────────────────

interface RefundCardProps {
  refund: Refund
  onPress: () => void
}

function RefundCard({ refund, onPress }: RefundCardProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const badgeVariant = STATUS_BADGE[refund.status] ?? 'default'

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      style={{
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutrals800,
        padding: 16,
        gap: 8,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText raw variant="labelSmall" color="muted" numberOfLines={1} style={{ flex: 1 }}>
          {t('refund.list.orderId')}: {refund.order_id}
        </AppText>
        <Badge variant={badgeVariant} size="sm">
          {t(`refund.status.${refund.status}`)}
        </Badge>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText raw variant="bodySmall">
          {t(`refund.reason.${refund.reason}`)}
        </AppText>
        <AppText raw variant="bodySmall" weight="semibold" color="primary">
          {refund.requested_amount.toLocaleString()}
        </AppText>
      </View>
      <AppText raw variant="labelSmall" color="muted">
        {new Date(refund.createdAt).toLocaleDateString()}
      </AppText>
    </TouchableOpacity>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RefundsScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyRefunds()

  const refunds = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('refund.list.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : refunds.length === 0 ? (
          <EmptyState icon={FileQuestion} message={t('refund.list.empty')} />
        ) : (
          <FlatList
            data={refunds}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <RefundCard refund={item} onPress={() => router.push(`/order/${item.order_id}`)} />
            )}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ paddingVertical: 16 }}
                />
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </>
  )
}
