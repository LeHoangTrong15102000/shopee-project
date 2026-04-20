import React from 'react'
import { View } from 'react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'

interface PriceBreakdownProps {
  subtotal: number
  shippingFee: number
  voucherDiscount?: number
  coinDiscount?: number
  total: number
}

export default function PriceBreakdown({
  subtotal,
  shippingFee,
  voucherDiscount = 0,
  coinDiscount = 0,
  total,
}: PriceBreakdownProps) {
  const colors = useColors()

  return (
    <View className="border-b border-neutrals900 px-4 py-4">
      <AppText raw variant="body" weight="semibold" className="mb-3">
        Chi tiết thanh toán
      </AppText>
      <View className="gap-2">
        <View className="flex-row justify-between">
          <AppText raw variant="bodySmall" color="muted">
            Tạm tính
          </AppText>
          <AppText raw variant="bodySmall">
            {formatPrice(subtotal)}
          </AppText>
        </View>
        <View className="flex-row justify-between">
          <AppText raw variant="bodySmall" color="muted">
            Phí vận chuyển
          </AppText>
          <AppText raw variant="bodySmall">
            {formatPrice(shippingFee)}
          </AppText>
        </View>
        {voucherDiscount > 0 && (
          <View className="flex-row justify-between">
            <AppText raw variant="bodySmall" color="muted">
              Giảm giá voucher
            </AppText>
            <AppText raw variant="bodySmall" style={{ color: colors.success }}>
              -{formatPrice(voucherDiscount)}
            </AppText>
          </View>
        )}
        {coinDiscount > 0 && (
          <View className="flex-row justify-between">
            <AppText raw variant="bodySmall" color="muted">
              Giảm giá Xu
            </AppText>
            <AppText raw variant="bodySmall" style={{ color: colors.success }}>
              -{formatPrice(coinDiscount)}
            </AppText>
          </View>
        )}
        <View className="flex-row justify-between border-t border-neutrals900 pt-2">
          <AppText raw variant="body" weight="bold">
            Tổng cộng
          </AppText>
          <AppText raw variant="body" weight="bold" color="primary">
            {formatPrice(total)}
          </AppText>
        </View>
      </View>
    </View>
  )
}
