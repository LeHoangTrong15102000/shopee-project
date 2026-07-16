import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { MapPin, AlertCircle } from 'lucide-react-native'
import { AppText, AppButton } from '@/components/ui'
import EmptyState from '@/components/ui/EmptyState'
import { useColors } from '@/hooks/useColors'
import { useOrderTracking } from '@/hooks/useOrderTracking'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderTrackingViewProps {
  orderId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders live tracking data for an order.
 * - Loading: activity indicator
 * - Not found (404): empty state (no tracking available yet)
 * - Other error: error + retry state
 * - Data: driver info, vehicle, status, estimated arrival
 *
 * Never blocks the rest of order detail — errors are contained here.
 */
export default function OrderTrackingView({ orderId }: OrderTrackingViewProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const { tracking, isLoading, isError, refetch } = useOrderTracking(orderId)

  if (isLoading) {
    return (
      <View style={{ padding: 24, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  // No tracking record yet — show silent empty state
  if (!tracking && !isError) {
    return <EmptyState icon={MapPin} message={t('tracking.empty')} />
  }

  if (isError || !tracking) {
    return (
      <View style={{ gap: 8, alignItems: 'center', paddingVertical: 16 }}>
        <AlertCircle size={32} color={colors.error} />
        <AppText raw variant="bodySmall" color="error" align="center">
          {t('tracking.error')}
        </AppText>
        <AppButton variant="outline" size="sm" onPress={() => refetch()}>
          {t('tracking.retry')}
        </AppButton>
      </View>
    )
  }

  return (
    <View style={{ gap: 10 }}>
      <AppText raw variant="bodySmall" weight="semibold">
        {t('tracking.title')}
      </AppText>

      {/* Status */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText raw variant="labelSmall" color="muted">
          {t('tracking.status')}
        </AppText>
        <AppText raw variant="labelSmall">
          {tracking.status}
        </AppText>
      </View>

      {/* Driver */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText raw variant="labelSmall" color="muted">
          {t('tracking.driver')}
        </AppText>
        <AppText raw variant="labelSmall">
          {tracking.driverName}
        </AppText>
      </View>

      {/* Vehicle */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText raw variant="labelSmall" color="muted">
          {t('tracking.vehicle')}
        </AppText>
        <AppText raw variant="labelSmall">
          {tracking.vehicleInfo}
        </AppText>
      </View>

      {/* Phone */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText raw variant="labelSmall" color="muted">
          {t('tracking.phone')}
        </AppText>
        <AppText raw variant="labelSmall">
          {tracking.driverPhone}
        </AppText>
      </View>

      {/* ETA */}
      {tracking.estimatedArrival && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText raw variant="labelSmall" color="muted">
            {t('tracking.eta')}
          </AppText>
          <AppText raw variant="labelSmall">
            {new Date(tracking.estimatedArrival).toLocaleString()}
          </AppText>
        </View>
      )}
    </View>
  )
}
