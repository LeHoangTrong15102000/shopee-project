import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

interface PaymentMethod {
  _id: string
  name: string
  description?: string
}

const DEFAULT_METHODS: PaymentMethod[] = [
  { _id: 'cod', name: 'Thanh toán khi nhận hàng', description: 'COD' },
  { _id: 'bank_transfer', name: 'Chuyển khoản ngân hàng' },
]

interface PaymentMethodSelectorProps {
  methods?: PaymentMethod[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function PaymentMethodSelector({
  methods = DEFAULT_METHODS,
  selectedId,
  onSelect,
}: PaymentMethodSelectorProps) {
  const colors = useColors()

  return (
    <View className="border-b border-neutrals900 px-4 py-4">
      <AppText raw variant="body" weight="semibold" className="mb-3">
        Phương thức thanh toán
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
