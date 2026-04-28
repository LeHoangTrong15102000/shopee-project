import React from 'react'
import { View, Image } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { formatPrice } from '@/utils/price'
import type { OrderItem as OrderItemType } from '@/apis/order.api'

interface OrderItemsProps {
  items: OrderItemType[]
}

export default function OrderItems({ items }: OrderItemsProps) {
  const { t } = useTranslation()

  return (
    <View className="border-b border-neutrals900 px-4 py-3">
      <AppText raw variant="body" weight="semibold" className="mb-3">
        {t('orderDetail.section.products')}
      </AppText>
      {items.map((item) => (
        <View key={item.product._id} className="mb-3 flex-row items-start gap-3">
          <Image
            source={{ uri: item.product.image }}
            style={{ width: 56, height: 56, borderRadius: 8 }}
            resizeMode="cover"
          />
          <View className="flex-1">
            <AppText raw variant="bodySmall" numberOfLines={2}>
              {item.product.name}
            </AppText>
            <View className="mt-1 flex-row items-center justify-between">
              <AppText raw variant="labelSmall" color="muted">
                x{item.buy_count}
              </AppText>
              <AppText raw variant="bodySmall" weight="semibold" color="primary">
                {formatPrice(item.price * item.buy_count)}
              </AppText>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}
