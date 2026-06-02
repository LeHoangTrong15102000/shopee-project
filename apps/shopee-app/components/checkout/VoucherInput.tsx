import React, { useState, useRef, useEffect } from 'react'
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'

interface VoucherInputProps {
  onApply: (code: string) => void
  onRemove?: () => void
  isValidating?: boolean
  appliedDiscount?: number
  errorMessage?: string
  initialCode?: string
}

export default function VoucherInput({
  onApply,
  onRemove,
  isValidating,
  appliedDiscount,
  errorMessage,
  initialCode = '',
}: VoucherInputProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const [code, setCode] = useState(initialCode)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasApplied = appliedDiscount != null && appliedDiscount > 0

  const handleChangeText = (text: string) => {
    setCode(text)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (text.trim().length > 0) {
      timerRef.current = setTimeout(() => {
        onApply(text.trim())
      }, 500)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const borderColor = errorMessage ? colors.error : hasApplied ? colors.success : colors.neutrals900

  return (
    <View className="border-b border-neutrals900 px-4 py-4">
      <AppText raw variant="body" weight="semibold" className="mb-3">
        {t('voucherInput.title')}
      </AppText>
      <View
        className="flex-row items-center overflow-hidden rounded-lg border"
        style={{ borderColor }}>
        <TextInput
          value={code}
          onChangeText={handleChangeText}
          placeholder={t('voucherInput.placeholder')}
          placeholderTextColor={colors.neutrals600}
          className="flex-1 bg-background px-3 py-3 font-sans-medium text-foreground"
          autoCapitalize="characters"
        />
        <TouchableOpacity
          onPress={() => code.trim() && onApply(code.trim())}
          disabled={isValidating || !code.trim()}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            opacity: !code.trim() ? 0.5 : 1,
          }}>
          {isValidating ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <AppText
              raw
              variant="bodySmall"
              weight="semibold"
              style={{ color: colors.primaryForeground }}>
              {t('voucherInput.button.apply')}
            </AppText>
          )}
        </TouchableOpacity>
      </View>
      {errorMessage && (
        <AppText raw variant="labelSmall" style={{ color: colors.error, marginTop: 4 }}>
          {errorMessage}
        </AppText>
      )}
      {hasApplied && !errorMessage && (
        <View className="mt-1 flex-row items-center justify-between">
          <AppText raw variant="labelSmall" style={{ color: colors.success }}>
            {t('voucherInput.applied', { formattedDiscount: formatPrice(appliedDiscount!) })}
          </AppText>
          {onRemove && (
            <TouchableOpacity onPress={onRemove} accessibilityRole="button">
              <AppText raw variant="labelSmall" style={{ color: colors.error }}>
                {t('vouchers.apply.remove')}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}
