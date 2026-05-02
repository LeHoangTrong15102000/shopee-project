import React from 'react'
import { View, FlatList, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText, AppImage } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useRecentlyViewedStore, RecentlyViewedProduct } from '@/store/recentlyViewedStore'
import { formatPrice } from '@/utils/price'

const CARD_WIDTH = 110
const CARD_HEIGHT = 110

export default function RecentlyViewedSection() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const products = useRecentlyViewedStore((state) => state.products)

  if (products.length === 0) return null

  return (
    <View style={{ paddingVertical: 12 }}>
      {/* Header row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          marginBottom: 10,
        }}>
        <AppText raw variant="heading4" weight="bold">
          {t('recentlyViewed.header.title')}
        </AppText>
        <TouchableOpacity
          onPress={() => router.push('/recently-viewed')}
          accessibilityRole="link">
          <AppText raw variant="bodySmall" style={{ color: colors.primary }}>
            {t('recentlyViewed.viewAll')}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Product list */}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }: { item: RecentlyViewedProduct }) => (
          <TouchableOpacity
            onPress={() => router.push(`/product/${item._id}`)}
            activeOpacity={0.8}
            style={{ width: CARD_WIDTH, marginRight: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.viewProduct', { name: item.name })}>
            <View
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: colors.neutrals900,
              }}>
              <AppImage
                source={{ uri: item.image }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            </View>
            <View style={{ marginTop: 4 }}>
              <AppText raw variant="labelSmall" numberOfLines={2}>
                {item.name}
              </AppText>
              <AppText raw variant="labelSmall" weight="semibold" style={{ color: colors.primary }}>
                {formatPrice(item.price)}
              </AppText>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
