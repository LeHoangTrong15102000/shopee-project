import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import type { Address } from '@/apis/address.api'

interface AddressSectionProps {
  selectedAddress: Address | null
  onChangeAddress: () => void
}

export default function AddressSection({ selectedAddress, onChangeAddress }: AddressSectionProps) {
  const { t } = useTranslation()
  const colors = useColors()

  if (!selectedAddress) {
    return (
      <View className="border-b border-neutrals900 px-4 py-4">
        <View className="flex-row items-center gap-2 mb-2">
          <MapPin size={16} color={colors.primary} />
          <AppText raw variant="body" weight="semibold">
            {t('checkoutAddress.title')}
          </AppText>
        </View>
        <AppButton variant="outline" onPress={onChangeAddress} className="w-full">
          {t('checkoutAddress.button.add')}
        </AppButton>
      </View>
    )
  }

  const fullAddress = [selectedAddress.street, selectedAddress.ward, selectedAddress.district, selectedAddress.city]
    .filter(Boolean)
    .join(', ')

  return (
    <View className="border-b border-neutrals900 px-4 py-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <MapPin size={16} color={colors.primary} />
          <AppText raw variant="body" weight="semibold">
            {t('checkoutAddress.title')}
          </AppText>
        </View>
        <TouchableOpacity onPress={onChangeAddress}>
          <AppText raw variant="bodySmall" color="primary">
            {t('checkoutAddress.button.change')}
          </AppText>
        </TouchableOpacity>
      </View>
      <AppText raw variant="bodySmall" weight="semibold">
        {selectedAddress.name} · {selectedAddress.phone}
      </AppText>
      <AppText raw variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
        {fullAddress}
      </AppText>
    </View>
  )
}
