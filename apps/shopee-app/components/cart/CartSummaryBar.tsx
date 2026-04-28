import React from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const colors = useColors()

  return (
    <View
      className="flex-row items-center gap-3 border-t border-neutrals900 bg-background px-4 py-3"
      style={{ paddingBottom: 16 }}>
      <Checkbox
        checked={allSelected}
        variant="primary"
        label={t('cartSummary.checkbox.all')}
        onValueChange={onToggleAll}
      />

      <View className="flex-1">
        <AppText raw variant="bodySmall" color="muted">
          {t('cartSummary.total.label', { totalSelected })}
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
        {t('cartSummary.button.checkout')}
      </AppButton>
    </View>
  )
}
