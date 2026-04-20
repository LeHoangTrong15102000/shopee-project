import React from 'react'
import { View, Image, TouchableOpacity } from 'react-native'
import { AppText, Badge, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'

import { type Order, type OrderItem } from '@/apis/order.api'

interface OrderCardProps {
  order: Order
  onPress: (id: string) => void
  onCancel?: (id: string) => void
  onConfirmReceived?: (id: string) => void
  onReturn?: (id: string) => void
}

function getStatusBadge(status: number): { label: string; variant: 'default' | 'warning' | 'primary' | 'success' | 'error' } {
  switch (status) {
    case 1:
      return { label: 'Chờ xác nhận', variant: 'warning' }
    case 2:
      return { label: 'Đang giao', variant: 'primary' }
    case 3:
      return { label: 'Đã giao', variant: 'success' }
    case -1:
      return { label: 'Đã hủy', variant: 'error' }
    default:
      return { label: `Trạng thái ${status}`, variant: 'default' }
  }
}

export default function OrderCard({
  order,
  onPress,
  onCancel,
  onConfirmReceived,
  onReturn,
}: OrderCardProps) {
  const colors = useColors()
  const statusInfo = getStatusBadge(order.status)
  const firstItem = order.items?.[0]
  const extraCount = (order.items?.length ?? 0) - 1

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
          <Image
            source={{ uri: firstItem.product.image }}
            style={{ width: 56, height: 56, borderRadius: 8 }}
            resizeMode="cover"
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
          +{extraCount} sản phẩm khác
        </AppText>
      )}

      {/* Total */}
      <View className="mt-2 flex-row items-center justify-between">
        <AppText raw variant="bodySmall" color="muted">
          Tổng cộng
        </AppText>
        <AppText raw variant="body" weight="semibold" color="primary">
          {formatPrice(order.total_price)}
        </AppText>
      </View>

      {/* Action buttons */}
      {(order.status === 1 || order.status === 2 || order.status === 3) && (
        <View className="mt-3 flex-row justify-end gap-2">
          {order.status === 1 && onCancel && (
            <AppButton
              variant="outline"
              size="sm"
              onPress={() => onCancel(order._id)}>
              Hủy đơn
            </AppButton>
          )}
          {order.status === 2 && onConfirmReceived && (
            <AppButton
              variant="primary"
              size="sm"
              onPress={() => onConfirmReceived(order._id)}>
              Đã nhận hàng
            </AppButton>
          )}
          {order.status === 3 && onReturn && (
            <AppButton
              variant="outline"
              size="sm"
              onPress={() => onReturn(order._id)}>
              Trả hàng
            </AppButton>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}
