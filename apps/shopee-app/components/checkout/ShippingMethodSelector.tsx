import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'

interface ShippingMethod {
  _id: string
  name: string
  estimated_days: number
  fee: number
}

interface ShippingMethodSelectorProps {
  methods: ShippingMethod[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function ShippingMethodSelector({
  methods,
  selectedId,
  onSelect,
}: ShippingMethodSelectorProps) {
  const { t } = useTranslation()
  const colors = useColors()

  return (
    <View className="border-b border-neutrals900 px-4 py-4">
      <AppText raw variant="body" weight="semibold" className="mb-3">
        {t('shippingMethod.title')}
      </AppText>
      <View className="gap-2">
        {methods.map((method) => {
          const isSelected = method._id === selectedId
          return (
            <TouchableOpacity
              key={method._id}
              onPress={() => onSelect(method._id)}
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
                <AppText raw variant="labelSmall" color="muted">
                  {method.estimated_days}
                </AppText>
              </View>
              <AppText raw variant="bodySmall" weight="semibold">
                {formatPrice(method.fee)}
              </AppText>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
