import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'

interface CheckoutFooterProps {
  total: number
  isSummarizing: boolean
  isCreating: boolean
  hasAddress: boolean
  onPlaceOrder: () => void
}

export default function CheckoutFooter({
  total,
  isSummarizing,
  isCreating,
  hasAddress,
  onPlaceOrder,
}: CheckoutFooterProps) {
  const { t } = useTranslation()
  const colors = useColors()

  return (
    <>
      <View
        className="border-t border-neutrals900 bg-background px-4 py-3"
        style={{ paddingBottom: 16 }}>
        <View className="mb-3 flex-row items-center justify-between">
          <AppText raw variant="bodySmall" color="muted">
            {t('checkout.summary.total')}
          </AppText>
          <AppText raw variant="body" weight="bold" color="primary">
            {isSummarizing ? '...' : formatPrice(total)}
          </AppText>
        </View>
        <AppButton
          variant="primary"
          onPress={onPlaceOrder}
          loading={isCreating}
          disabled={isCreating || !hasAddress}
          className="w-full">
          {t('checkout.button.placeOrder')}
        </AppButton>
      </View>

      {isCreating && (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              backgroundColor: colors.neutrals1000,
              padding: 24,
              borderRadius: 12,
              alignItems: 'center',
              gap: 12,
            }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText raw variant="body">
              {t('checkout.button.placing')}
            </AppText>
          </View>
        </View>
      )}
    </>
  )
}
