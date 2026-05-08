import React from 'react'
import { View, TouchableOpacity, Alert } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { type FollowedShop } from '@/store/followedShopsStore'

interface FollowedShopCardProps {
  shop: FollowedShop
  onUnfollow: (shopId: string) => void
  isUnfollowing?: boolean
}

export default function FollowedShopCard({ shop, onUnfollow, isUnfollowing }: FollowedShopCardProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()

  const handleUnfollow = () => {
    Alert.alert(
      t('followedShops.confirmUnfollow'),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('followedShops.unfollow'), style: 'destructive', onPress: () => onUnfollow(shop._id) },
      ]
    )
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/shop/${shop._id}`)}
      accessibilityRole="button"
      className="flex-row items-center px-4 py-3 border-b border-neutrals900">
      {/* Avatar */}
      <Image
        source={{ uri: shop.avatar }}
        style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.neutrals800 }}
        contentFit="cover"
        accessibilityLabel={shop.name}
      />

      {/* Info */}
      <View className="flex-1 mx-3 gap-0.5">
        <AppText raw variant="body" weight="semibold" numberOfLines={1}>
          {shop.name}
        </AppText>
        <AppText raw variant="labelSmall" color="muted">
          {t('followedShops.productCount', { count: shop.productCount })}
          {'  '}
          {t('followedShops.followerCount', { count: shop.followerCount })}
        </AppText>
      </View>

      {/* Unfollow button */}
      <AppButton
        variant="outline"
        size="sm"
        onPress={handleUnfollow}
        loading={isUnfollowing}>
        {t('followedShops.unfollow')}
      </AppButton>
    </TouchableOpacity>
  )
}
