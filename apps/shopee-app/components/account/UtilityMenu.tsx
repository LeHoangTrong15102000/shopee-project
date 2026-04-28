import React from 'react'
import { View } from 'react-native'
import { Heart, MapPin, Bell, Calendar, Tag, Coins } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { MenuList, AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

interface UtilityMenuProps {
  onWishlist: () => void
  onAddresses: () => void
  onNotifications: () => void
  onCheckin: () => void
  onVouchers: () => void
  onXuHistory: () => void
}

export default function UtilityMenu({
  onWishlist,
  onAddresses,
  onNotifications,
  onCheckin,
  onVouchers,
  onXuHistory,
}: UtilityMenuProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const items = [
    {
      title: t('account.menu.wishlist'),
      icon: () => <Heart size={20} color={colors.primary} />,
      onPress: onWishlist,
    },
    {
      title: t('account.menu.addresses'),
      icon: () => <MapPin size={20} color={colors.secondary} />,
      onPress: onAddresses,
    },
    {
      title: t('account.menu.notifications'),
      icon: () => <Bell size={20} color={colors.warning} />,
      onPress: onNotifications,
    },
    {
      title: t('account.menu.checkin'),
      icon: () => <Calendar size={20} color={colors.success} />,
      onPress: onCheckin,
    },
    {
      title: t('account.menu.xu_history'),
      icon: () => <Coins size={20} color={colors.coin} />,
      onPress: onXuHistory,
    },
    {
      title: t('account.menu.vouchers'),
      icon: () => <Tag size={20} color={colors.error} />,
      onPress: onVouchers,
    },
  ]

  return (
    <View className="px-4 py-4">
      <AppText raw variant="bodySmall" weight="semibold" color="muted" className="mb-3">
        {t('account.section.utilities')}
      </AppText>
      <MenuList data={items} />
    </View>
  )
}
