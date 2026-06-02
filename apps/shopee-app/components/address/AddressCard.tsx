import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const colors = useColors()

  const fullAddress = [address.street, address.ward, address.district, address.city]
    .filter(Boolean)
    .join(', ')

  return (
    <TouchableOpacity
      onPress={selectable ? () => onSelect?.(address._id) : undefined}
      activeOpacity={selectable ? 0.7 : 1}
      className="border-b border-neutrals900 bg-background px-4 py-4">
      <View className="mb-1 flex-row items-start justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          <AppText raw variant="bodySmall" weight="semibold">
            {address.name}
          </AppText>
          <AppText raw variant="bodySmall" color="muted">
            {address.phone}
          </AppText>
          {address.is_default && (
            <Badge variant="primary" size="sm">
              {t('addressCard.badge.default')}
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
              {t('addressCard.button.edit')}
            </AppText>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(address._id)}>
            <AppText raw variant="labelSmall" style={{ color: colors.error }}>
              {t('addressCard.button.delete')}
            </AppText>
          </TouchableOpacity>
        )}
        {!address.is_default && onSetDefault && (
          <TouchableOpacity onPress={() => onSetDefault(address._id)}>
            <AppText raw variant="labelSmall" color="muted">
              {t('addressCard.button.setDefault')}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}
