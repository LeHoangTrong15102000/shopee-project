import React from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText, Checkbox, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'

interface CartSummaryProps {
  totalSelected: number
  totalAmount: number
  allSelected: boolean
  onToggleAll: () => void
  onCheckout: () => void
}

export default function CartSummary({
  totalSelected,
  totalAmount,
  allSelected,
  onToggleAll,
  onCheckout,
}: CartSummaryProps) {
  const { t } = useTranslation()
  const colors = useColors()

  return (
    <View
      className="flex-row items-center gap-3 border-t border-neutrals900 bg-background px-4 py-3"
      style={{ paddingBottom: 16 }}>
      <Checkbox
        checked={allSelected}
        onPress={onToggleAll}
        label={t('cartSummary.checkbox.all')}
      />
      <View className="flex-1">
        <AppText raw variant="labelSmall" color="muted">
          {t('cartSummary.total.label', { totalSelected })}
        </AppText>
        <AppText raw variant="body" weight="bold" color="primary">
          {formatPrice(totalAmount)}
        </AppText>
      </View>
      <AppButton
        variant="primary"
        onPress={onCheckout}
        disabled={totalSelected === 0}
        className="px-6">
        {t('cartSummary.button.checkout')}
      </AppButton>
    </View>
  )
}
