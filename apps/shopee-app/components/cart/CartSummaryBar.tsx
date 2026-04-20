import React from 'react'
import { View } from 'react-native'
import { AppText, Checkbox, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'

interface CartSummaryBarProps {
  totalSelected: number
  totalAmount: number
  allSelected: boolean
  onToggleAll: () => void
  onCheckout: () => void
}

export default function CartSummaryBar({
  totalSelected,
  totalAmount,
  allSelected,
  onToggleAll,
  onCheckout,
}: CartSummaryBarProps) {
  const colors = useColors()

  return (
    <View
      className="flex-row items-center gap-3 border-t border-neutrals900 bg-background px-4 py-3"
      style={{ paddingBottom: 16 }}>
      <Checkbox
        checked={allSelected}
        variant="primary"
        label="Tất cả"
        onValueChange={onToggleAll}
      />

      <View className="flex-1">
        <AppText raw variant="bodySmall" color="muted">
          Tổng ({totalSelected} sản phẩm)
        </AppText>
        <AppText raw variant="body" weight="bold" color="primary">
          {formatPrice(totalAmount)}
        </AppText>
      </View>

      <AppButton
        variant="primary"
        disabled={totalSelected === 0}
        onPress={onCheckout}
        className="px-6">
        Mua hàng
      </AppButton>
    </View>
  )
}
