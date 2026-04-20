import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { AppText, Badge, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { type Address } from '@/apis/address.api'

interface AddressCardProps {
  address: Address
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onSetDefault?: (id: string) => void
  onSelect?: (id: string) => void
  selectable?: boolean
}

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  onSelect,
  selectable,
}: AddressCardProps) {
  const colors = useColors()

  const fullAddress = [address.street, address.ward, address.district, address.city]
    .filter(Boolean)
    .join(', ')

  return (
    <TouchableOpacity
      onPress={selectable ? () => onSelect?.(address._id) : undefined}
      activeOpacity={selectable ? 0.7 : 1}
      className="border-b border-neutrals900 bg-background px-4 py-4">
      <View className="flex-row items-start justify-between mb-1">
        <View className="flex-row items-center gap-2 flex-1">
          <AppText raw variant="bodySmall" weight="semibold">
            {address.name}
          </AppText>
          <AppText raw variant="bodySmall" color="muted">
            {address.phone}
          </AppText>
          {address.is_default && (
            <Badge variant="primary" size="sm">
              Mặc định
            </Badge>
          )}
        </View>
      </View>

      <AppText raw variant="bodySmall" color="muted" style={{ marginBottom: 8 }}>
        {fullAddress}
      </AppText>

      <View className="flex-row items-center gap-2">
        {onEdit && (
          <TouchableOpacity onPress={() => onEdit(address._id)}>
            <AppText raw variant="labelSmall" color="primary">
              Sửa
            </AppText>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(address._id)}>
            <AppText raw variant="labelSmall" style={{ color: colors.error }}>
              Xóa
            </AppText>
          </TouchableOpacity>
        )}
        {!address.is_default && onSetDefault && (
          <TouchableOpacity onPress={() => onSetDefault(address._id)}>
            <AppText raw variant="labelSmall" color="muted">
              Đặt mặc định
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}
