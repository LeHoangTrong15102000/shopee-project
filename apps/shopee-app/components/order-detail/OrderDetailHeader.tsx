import React from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText, Badge } from '@/components/ui'
import { ORDER_STATUS, type OrderStatusType } from '@/constants/order'

interface OrderDetailHeaderProps {
  orderId: string
  status: string
}

type BadgeVariant = 'success' | 'error' | 'primary' | 'warning' | 'default'

const STATUS_CONFIG: Record<OrderStatusType, { labelKey: string; variant: BadgeVariant }> = {
  [ORDER_STATUS.PENDING]: { labelKey: 'orderDetail.status.pending', variant: 'warning' },
  [ORDER_STATUS.CONFIRMED]: { labelKey: 'orderDetail.status.confirmed', variant: 'primary' },
  [ORDER_STATUS.PROCESSING]: { labelKey: 'orderDetail.status.processing', variant: 'default' },
  [ORDER_STATUS.SHIPPING]: { labelKey: 'orderDetail.status.shipping', variant: 'primary' },
  [ORDER_STATUS.DELIVERED]: { labelKey: 'orderDetail.status.delivered', variant: 'success' },
  [ORDER_STATUS.CANCELLED]: { labelKey: 'orderDetail.status.cancelled', variant: 'error' },
  [ORDER_STATUS.RETURNED]: { labelKey: 'orderDetail.status.returned', variant: 'default' },
}

export default function OrderDetailHeader({ orderId, status }: OrderDetailHeaderProps) {
  const { t } = useTranslation()

  const config = STATUS_CONFIG[status as OrderStatusType]
  const label = config ? t(config.labelKey) : t('orderDetail.status.unknown', { status })
  const variant: BadgeVariant = config?.variant ?? 'warning'

  return (
    <View className="border-b border-neutrals900 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <AppText raw variant="bodySmall" color="muted">
          {t('orderDetail.section.orderId', { orderId: orderId.slice(-8).toUpperCase() })}
        </AppText>
        <Badge variant={variant} size="sm">
          {label}
        </Badge>
      </View>
    </View>
  )
}
