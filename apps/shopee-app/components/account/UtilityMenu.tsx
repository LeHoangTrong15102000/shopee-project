import React, { useMemo } from 'react'
import { View } from 'react-native'
import { Heart, MapPin, Bell, Calendar, Tag, Coins, Store, HelpCircle, MessageCircle } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { MenuList, AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useWishlistCount } from '@/hooks/useWishlist'

interface UtilityMenuProps {
  onWishlist: () => void
  onAddresses: () => void
  onNotifications: () => void
  onCheckin: () => void
  onVouchers: () => void
  onXuHistory: () => void
  onFollowedShops: () => void
  onHelp: () => void
  onChat: () => void
}

export default function UtilityMenu({
  onWishlist,
  onAddresses,
  onNotifications,
  onCheckin,
  onVouchers,
  onXuHistory,
  onFollowedShops,
  onHelp,
  onChat,
}: UtilityMenuProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const { data: wishlistCountData } = useWishlistCount()
  const wishlistCount = wishlistCountData?.data?.count ?? 0

  const wishlistBadge =
    wishlistCount > 0 ? (
      <View
        style={{
          backgroundColor: colors.primary,
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 5,
          marginRight: 4,
        }}>
        <AppText raw variant="labelSmall" style={{ color: '#fff', fontSize: 11 }}>
          {wishlistCount > 99 ? '99+' : wishlistCount}
        </AppText>
      </View>
    ) : undefined

  const items = useMemo(() => [
    {
      title: t('account.menu.chat'),
      icon: () => <MessageCircle size={20} color={colors.primary} />,
      onPress: onChat,
    },
    {
      title: t('account.menu.wishlist'),
      icon: () => <Heart size={20} color={colors.primary} />,
      onPress: onWishlist,
      value: wishlistBadge,
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
    {
      title: t('account.menu.followedShops'),
      icon: () => <Store size={20} color={colors.foreground} />,
      onPress: onFollowedShops,
    },
    {
      title: t('account.menu.help'),
      icon: () => <HelpCircle size={20} color={colors.foreground} />,
      onPress: onHelp,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, colors.primary, colors.secondary, colors.warning, colors.success, colors.coin, colors.error, colors.foreground, onChat, onWishlist, onAddresses, onNotifications, onCheckin, onXuHistory, onVouchers, onFollowedShops, onHelp, wishlistBadge])

  return (
    <View className="px-4 py-4">
      <AppText raw variant="bodySmall" weight="semibold" color="muted" className="mb-3">
        {t('account.section.utilities')}
      </AppText>
      <MenuList data={items} />
    </View>
  )
}
