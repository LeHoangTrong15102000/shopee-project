import React, { useRef, useState, useCallback } from 'react'
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { BellDot, BellOff } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { usePriceAlerts, useCreatePriceAlert, useDeletePriceAlert } from '@/hooks/usePriceAlerts'

interface PriceAlertButtonProps {
  productId: string
}

export default function PriceAlertButton({ productId }: PriceAlertButtonProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const [targetPriceInput, setTargetPriceInput] = useState('')
  const [validationError, setValidationError] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const { data: alerts, isLoading: alertsLoading } = usePriceAlerts()
  const createAlert = useCreatePriceAlert()
  const deleteAlert = useDeletePriceAlert()

  const existingAlert = alerts?.find((a) => a.productId === productId) ?? null

  const handleOpen = useCallback(() => {
    setTargetPriceInput(existingAlert ? String(existingAlert.targetPrice) : '')
    setValidationError('')
    bottomSheetRef.current?.present()
  }, [existingAlert])

  const handleDismiss = useCallback(() => {
    setTargetPriceInput('')
    setValidationError('')
  }, [])

  const handleConfirm = () => {
    const trimmed = targetPriceInput.trim()
    if (!trimmed) {
      setValidationError(t('priceAlerts.sheet.validation.required'))
      return
    }
    const parsed = Number(trimmed)
    if (isNaN(parsed) || parsed <= 0) {
      setValidationError(t('priceAlerts.sheet.validation.positive'))
      return
    }
    setValidationError('')
    createAlert.mutate(
      { productId, targetPrice: parsed },
      { onSuccess: () => bottomSheetRef.current?.dismiss() }
    )
  }

  const handleRemove = () => {
    if (!existingAlert) return
    deleteAlert.mutate(existingAlert._id, {
      onSuccess: () => bottomSheetRef.current?.dismiss(),
    })
  }

  if (alertsLoading) {
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  return (
    <>
      <TouchableOpacity
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={
          existingAlert ? t('priceAlerts.button.removeAlert') : t('priceAlerts.button.setAlert')
        }
        style={{
          marginHorizontal: 16,
          marginVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: existingAlert ? colors.warning : colors.primary,
          backgroundColor: existingAlert
            ? `${colors.warning}15`
            : `${colors.primary}10`,
        }}>
        {existingAlert ? (
          <BellOff size={18} color={colors.warning} />
        ) : (
          <BellDot size={18} color={colors.primary} />
        )}
        <AppText
          raw
          variant="body"
          weight="semibold"
          style={{ color: existingAlert ? colors.warning : colors.primary }}>
          {existingAlert ? t('priceAlerts.button.removeAlert') : t('priceAlerts.button.setAlert')}
        </AppText>
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        keyboardBehavior="interactive"
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.neutrals400 }}
        onDismiss={handleDismiss}>
        <BottomSheetView
          style={{ paddingHorizontal: 16, paddingBottom: 32 }}
          accessibilityViewIsModal={true}>
          <AppText raw variant="heading4" weight="bold" style={{ marginBottom: 16 }}>
            {t('priceAlerts.sheet.title')}
          </AppText>

          {existingAlert ? (
            <>
              <AppText raw variant="bodySmall" color="muted" style={{ marginBottom: 4 }}>
                {t('priceAlerts.sheet.existingAlert')}
              </AppText>
              <AppText raw variant="body" weight="semibold" style={{ marginBottom: 20 }}>
                {existingAlert.targetPrice.toLocaleString()}₫
              </AppText>
              <AppButton
                variant="outline"
                onPress={handleRemove}
                loading={deleteAlert.isPending}
                disabled={deleteAlert.isPending}>
                {t('priceAlerts.button.removeAlert')}
              </AppButton>
            </>
          ) : (
            <>
              <AppText raw variant="bodySmall" weight="medium" style={{ marginBottom: 8 }}>
                {t('priceAlerts.sheet.targetPrice')}
              </AppText>
              <TextInput
                value={targetPriceInput}
                onChangeText={(text) => {
                  setTargetPriceInput(text)
                  if (validationError) setValidationError('')
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t('priceAlerts.sheet.targetPricePlaceholder')}
                placeholderTextColor={colors.neutrals400}
                keyboardType="numeric"
                style={{
                  backgroundColor: colors.neutrals800,
                  color: colors.foreground,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: validationError
                    ? colors.error
                    : isFocused
                    ? colors.primary
                    : colors.neutrals700,
                  marginBottom: 4,
                }}
                accessibilityLabel={t('priceAlerts.sheet.targetPrice')}
              />
              {validationError ? (
                <AppText raw variant="labelSmall" color="error" style={{ marginBottom: 8 }}>
                  {validationError}
                </AppText>
              ) : (
                <View style={{ marginBottom: 8 }} />
              )}
              <AppButton
                variant="primary"
                onPress={handleConfirm}
                loading={createAlert.isPending}
                disabled={createAlert.isPending}>
                {t('priceAlerts.button.confirm')}
              </AppButton>
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
}
