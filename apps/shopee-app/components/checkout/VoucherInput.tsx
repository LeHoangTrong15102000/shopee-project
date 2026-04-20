import React, { useState, useRef, useEffect } from 'react'
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'

interface VoucherInputProps {
  onApply: (code: string) => void
  isValidating?: boolean
  appliedDiscount?: number
  errorMessage?: string
  initialCode?: string
}

export default function VoucherInput({
  onApply,
  isValidating,
  appliedDiscount,
  errorMessage,
  initialCode = '',
}: VoucherInputProps) {
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

  const borderColor = errorMessage
    ? colors.error
    : hasApplied
      ? colors.success
      : colors.neutrals900

  return (
    <View className="border-b border-neutrals900 px-4 py-4">
      <AppText raw variant="body" weight="semibold" className="mb-3">
        Mã giảm giá
      </AppText>
      <View
        className="flex-row items-center rounded-lg border overflow-hidden"
        style={{ borderColor }}>
        <TextInput
          value={code}
          onChangeText={handleChangeText}
          placeholder="Nhập mã voucher"
          placeholderTextColor={colors.neutrals600}
          className="flex-1 px-3 py-3 font-sans-medium text-foreground bg-background"
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
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <AppText raw variant="bodySmall" weight="semibold" style={{ color: '#fff' }}>
              Áp dụng
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
        <AppText raw variant="labelSmall" style={{ color: colors.success, marginTop: 4 }}>
          Đã áp dụng: -{formatPrice(appliedDiscount!)}
        </AppText>
      )}
    </View>
  )
}
