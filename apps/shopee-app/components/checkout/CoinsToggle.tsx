import React from 'react'
import { View } from 'react-native'
import { AppText, Switch } from '@/components/ui'
import { formatPrice } from '@/utils/price'

interface CoinsToggleProps {
  coinBalance: number
  enabled: boolean
  onToggle: (value: boolean) => void
}

export default function CoinsToggle({ coinBalance, enabled, onToggle }: CoinsToggleProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutrals900 px-4 py-4">
      <View>
        <AppText raw variant="body" weight="semibold">
          Dùng Shopee Xu
        </AppText>
        <AppText raw variant="bodySmall" color="muted">
          Số dư: {coinBalance.toLocaleString('vi-VN')} Xu ({formatPrice(coinBalance)})
        </AppText>
      </View>
      <Switch value={enabled} onValueChange={onToggle} size="md" />
    </View>
  )
}
