import React from 'react'
import { View, TextInput, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'

interface VoucherSectionProps {
  appliedVoucher?: string
  appliedDiscount?: number
  onApplyVoucher: (code: string) => void
  errorMessage?: string
}

export default function VoucherSection({
  appliedVoucher,
  appliedDiscount,
  onApplyVoucher,
  errorMessage,
}: VoucherSectionProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const [code, setCode] = React.useState(appliedVoucher ?? '')
  const hasApplied = appliedDiscount != null && appliedDiscount > 0

  const borderColor = errorMessage
    ? colors.error
    : hasApplied
      ? colors.success
      : colors.neutrals900

  return (
    <View className="border-b border-neutrals900 px-4 py-4">
      <AppText raw variant="body" weight="semibold" className="mb-3">
        {t('voucherInput.title')}
      </AppText>
      <View
        className="flex-row items-center rounded-lg border overflow-hidden"
        style={{ borderColor }}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder={t('voucherInput.placeholder')}
          placeholderTextColor={colors.neutrals600}
          className="flex-1 px-3 py-3 font-sans-medium text-foreground bg-background"
          autoCapitalize="characters"
        />
        <TouchableOpacity
          onPress={() => code.trim() && onApplyVoucher(code.trim())}
          disabled={!code.trim()}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            opacity: !code.trim() ? 0.5 : 1,
          }}>
          <AppText raw variant="bodySmall" weight="semibold" style={{ color: colors.primaryForeground }}>
            {t('voucherInput.button.apply')}
          </AppText>
        </TouchableOpacity>
      </View>
      {errorMessage && (
        <AppText raw variant="labelSmall" style={{ color: colors.error, marginTop: 4 }}>
          {errorMessage}
        </AppText>
      )}
      {hasApplied && !errorMessage && (
        <AppText raw variant="labelSmall" style={{ color: colors.success, marginTop: 4 }}>
          {t('voucherInput.applied', { formattedDiscount: formatPrice(appliedDiscount!) })}
        </AppText>
      )}
    </View>
  )
}
