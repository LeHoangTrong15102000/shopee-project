import React from 'react'
import { View, Image, TouchableOpacity } from 'react-native'
import { Star, Users } from 'lucide-react-native'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { Shop } from '@/types/shop.type'

interface ShopHeaderProps {
  shop: Shop
  isFollowing: boolean
  onFollow: () => void
  followLoading?: boolean
}

export default function ShopHeader({ shop, isFollowing, onFollow, followLoading }: ShopHeaderProps) {
  const colors = useColors()

  return (
    <View>
      {/* Cover image */}
      <View style={{ height: 160, backgroundColor: colors.neutrals800 }}>
        {shop.coverImage ? (
          <Image
            source={{ uri: shop.coverImage }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            accessibilityLabel={`${shop.name} cover image`}
          />
        ) : null}
      </View>

      {/* Avatar + info row */}
      <View className="px-4 pb-4" style={{ backgroundColor: colors.background }}>
        <View className="flex-row items-end justify-between" style={{ marginTop: -32 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: 3,
              borderColor: colors.background,
              backgroundColor: colors.neutrals800,
              overflow: 'hidden',
            }}>
            {shop.avatar ? (
              <Image
                source={{ uri: shop.avatar }}
                style={{ width: '100%', height: '100%' }}
                accessibilityLabel={`${shop.name} avatar`}
              />
            ) : null}
          </View>

          <AppButton
            variant={isFollowing ? 'outline' : 'primary'}
            size="sm"
            onPress={onFollow}
            loading={followLoading}
            accessibilityRole="button"
            accessibilityLabel={isFollowing ? 'Unfollow shop' : 'Follow shop'}>
            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </AppButton>
        </View>

        <AppText raw variant="heading4" weight="bold" className="mt-2">
          {shop.name}
        </AppText>

        {shop.description ? (
          <AppText raw variant="bodySmall" color="muted" className="mt-1" numberOfLines={2}>
            {shop.description}
          </AppText>
        ) : null}

        {/* Metrics row */}
        <View className="mt-3 flex-row flex-wrap gap-4">
          <View className="flex-row items-center gap-1">
            <Star size={14} color={colors.warning} fill={colors.warning} />
            <AppText raw variant="bodySmall">
              {shop.rating.toFixed(1)}
            </AppText>
          </View>

          <View className="flex-row items-center gap-1">
            <Users size={14} color={colors.neutrals100} />
            <AppText raw variant="bodySmall">
              {shop.followerCount.toLocaleString()} người theo dõi
            </AppText>
          </View>

          <AppText raw variant="bodySmall" color="muted">
            Phản hồi: {shop.responseTime}
          </AppText>

          <AppText raw variant="bodySmall" color="muted">
            Tỉ lệ phản hồi: {shop.responseRate}%
          </AppText>
        </View>
      </View>
    </View>
  )
}
