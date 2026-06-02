import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

interface PaymentMethod {
  _id: string
  name: string
  description?: string
}

interface PaymentSectionProps {
  selectedPaymentMethod: string
  onChangePayment: (id: string) => void
  methods?: PaymentMethod[]
}

export default function PaymentSection({
  selectedPaymentMethod,
  onChangePayment,
  methods,
}: PaymentSectionProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const defaultMethods: PaymentMethod[] = [
    {
      _id: 'cod',
      name: t('paymentMethod.cod.name'),
      description: t('paymentMethod.cod.description'),
    },
    { _id: 'bank_transfer', name: t('paymentMethod.bankTransfer.name') },
  ]

  const resolvedMethods = methods ?? defaultMethods

  return (
    <View className="border-b border-neutrals900 px-4 py-4">
      <AppText raw variant="body" weight="semibold" className="mb-3">
        {t('paymentMethod.title')}
      </AppText>
      <View className="gap-2">
        {resolvedMethods.map((method) => {
          const isSelected = method._id === selectedPaymentMethod
          return (
            <TouchableOpacity
              key={method._id}
              onPress={() => onChangePayment(method._id)}
              className="flex-row items-center gap-3 rounded-lg border p-3"
              style={{ borderColor: isSelected ? colors.primary : colors.neutrals900 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.primary : colors.neutrals400,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {isSelected && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.primary,
                    }}
                  />
                )}
              </View>
              <View className="flex-1">
                <AppText raw variant="bodySmall" weight="semibold">
                  {method.name}
                </AppText>
                {method.description && (
                  <AppText raw variant="labelSmall" color="muted">
                    {method.description}
                  </AppText>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
