import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText, Badge, AppButton, AppImage } from '@/components/ui'
import { formatPrice } from '@/utils/price'
import { type Order } from '@/apis/order.api'
import { ORDER_STATUS, type OrderStatusType } from '@/constants/order'

interface OrderCardProps {
  order: Order
  onPress: (id: string) => void
  onCancel?: (id: string) => void
  onConfirmReceived?: (id: string) => void
  onReturn?: (id: string) => void
}

function useStatusBadge(status: OrderStatusType): {
  label: string
  variant: 'default' | 'warning' | 'primary' | 'success' | 'error'
} {
  const { t } = useTranslation()

  switch (status) {
    case ORDER_STATUS.PENDING:
      return { label: t('orderCard.status.pending'), variant: 'warning' }
    case ORDER_STATUS.PAYMENT_PENDING:
      return { label: t('orderCard.status.payment_pending'), variant: 'warning' }
    case ORDER_STATUS.PAYMENT_FAILED:
      return { label: t('orderCard.status.payment_failed'), variant: 'error' }
    case ORDER_STATUS.CONFIRMED:
      return { label: t('orderCard.status.confirmed'), variant: 'primary' }
    case ORDER_STATUS.PROCESSING:
      return { label: t('orderCard.status.processing'), variant: 'default' }
    case ORDER_STATUS.SHIPPING:
      return { label: t('orderCard.status.shipping'), variant: 'primary' }
    case ORDER_STATUS.DELIVERED:
      return { label: t('orderCard.status.delivered'), variant: 'success' }
    case ORDER_STATUS.CANCELLED:
      return { label: t('orderCard.status.cancelled'), variant: 'error' }
    case ORDER_STATUS.RETURNED:
      return { label: t('orderCard.status.returned'), variant: 'default' }
  }
}

export default function OrderCard({
  order,
  onPress,
  onCancel,
  onConfirmReceived,
  onReturn,
}: OrderCardProps) {
  const { t } = useTranslation()
  const statusInfo = useStatusBadge(order.status)
  const firstItem = order.items?.[0]
  const extraCount = (order.items?.length ?? 0) - 1

  const canCancel = order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.CONFIRMED
  const canConfirmReceived = order.status === ORDER_STATUS.SHIPPING
  const canReturn = order.status === ORDER_STATUS.DELIVERED
  const hasActions = canCancel || canConfirmReceived || canReturn

  return (
    <TouchableOpacity
      onPress={() => onPress(order._id)}
      className="border-b border-neutrals900 bg-background px-4 py-3">
      {/* Header: Order ID + Status */}
      <View className="mb-2 flex-row items-center justify-between">
        <AppText raw variant="labelSmall" color="muted">
          #{order._id.slice(-8).toUpperCase()}
        </AppText>
        <Badge variant={statusInfo.variant} size="sm">
          {statusInfo.label}
        </Badge>
      </View>

      {/* First product */}
      {firstItem && (
        <View className="flex-row items-center gap-3">
          <AppImage
            source={{ uri: firstItem.product.image }}
            style={{ width: 56, height: 56, borderRadius: 8 }}
            contentFit="cover"
          />
          <View className="flex-1">
            <AppText raw variant="bodySmall" numberOfLines={2}>
              {firstItem.product.name}
            </AppText>
            <AppText raw variant="labelSmall" color="muted" style={{ marginTop: 2 }}>
              x{firstItem.buy_count}
            </AppText>
          </View>
        </View>
      )}

      {extraCount > 0 && (
        <AppText raw variant="labelSmall" color="muted" style={{ marginTop: 4 }}>
          {t('orderCard.moreProducts', { extraCount })}
        </AppText>
      )}

      {/* Total */}
      <View className="mt-2 flex-row items-center justify-between">
        <AppText raw variant="bodySmall" color="muted">
          {t('orderCard.total')}
        </AppText>
        <AppText raw variant="body" weight="semibold" color="primary">
          {formatPrice(order.total_price)}
        </AppText>
      </View>

      {/* Action buttons */}
      {hasActions && (
        <View className="mt-3 flex-row justify-end gap-2">
          {canCancel && onCancel && (
            <AppButton variant="outline" size="sm" onPress={() => onCancel(order._id)}>
              {t('orderCard.button.cancel')}
            </AppButton>
          )}
          {canConfirmReceived && onConfirmReceived && (
            <AppButton variant="primary" size="sm" onPress={() => onConfirmReceived(order._id)}>
              {t('orderCard.button.confirmReceived')}
            </AppButton>
          )}
          {canReturn && onReturn && (
            <AppButton variant="outline" size="sm" onPress={() => onReturn(order._id)}>
              {t('orderCard.button.return')}
            </AppButton>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}
