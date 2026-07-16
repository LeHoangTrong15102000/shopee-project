import React from 'react'
import { View, FlatList } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import ProductCard from '@/components/home/ProductCard'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useAuthStore } from '@/store/authStore'
import { type Product } from '@/types/product.type'

/**
 * Server-backed recently-viewed rail.
 * Hides when the user is a guest, the list is empty, or a fetch error occurs.
 * Reuses the existing ProductCard component; newest-first order is server-side.
 */
export default function RecentlyViewedRail() {
  const { t } = useTranslation()
  const colors = useColors()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const { data: products, isError } = useRecentlyViewed()

  // Hide for guests, on error, or when the list is empty
  if (!isAuthenticated || isError || !products || products.length === 0) {
    return null
  }

  return (
    <View style={{ paddingVertical: 12 }}>
      <View
        style={{
          paddingHorizontal: 16,
          marginBottom: 10,
        }}>
        <AppText raw variant="heading4" weight="bold" style={{ color: colors.foreground }}>
          {t('recentlyViewed.header.title')}
        </AppText>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item: Product) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        renderItem={({ item }: { item: Product }) => <ProductCard product={item} />}
      />
    </View>
  )
}
