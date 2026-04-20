import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { type Address } from '@/apis/address.api'

interface CheckoutAddressCardProps {
  address: Address | null
  onChangeAddress: () => void
}

export default function CheckoutAddressCard({ address, onChangeAddress }: CheckoutAddressCardProps) {
  const colors = useColors()

  if (!address) {
    return (
      <View className="border-b border-neutrals900 px-4 py-4">
        <View className="flex-row items-center gap-2 mb-2">
          <MapPin size={16} color={colors.primary} />
          <AppText raw variant="body" weight="semibold">
            Địa chỉ giao hàng
          </AppText>
        </View>
        <AppButton variant="outline" onPress={onChangeAddress} className="w-full">
          Thêm địa chỉ giao hàng
        </AppButton>
      </View>
    )
  }

  const fullAddress = [address.street, address.ward, address.district, address.city]
    .filter(Boolean)
    .join(', ')

  return (
    <View className="border-b border-neutrals900 px-4 py-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <MapPin size={16} color={colors.primary} />
          <AppText raw variant="body" weight="semibold">
            Địa chỉ giao hàng
          </AppText>
        </View>
        <TouchableOpacity onPress={onChangeAddress}>
          <AppText raw variant="bodySmall" color="primary">
            Thay đổi
          </AppText>
        </TouchableOpacity>
      </View>

      <AppText raw variant="bodySmall" weight="semibold">
        {address.name} · {address.phone}
      </AppText>
      <AppText raw variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
        {fullAddress}
      </AppText>
    </View>
  )
}
