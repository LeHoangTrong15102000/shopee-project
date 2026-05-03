import React, { useCallback } from 'react'
import { View, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react-native'
import { EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useRecentlyViewedStore, RecentlyViewedProduct } from '@/store/recentlyViewedStore'
import ProductCard, { CARD_GAP, CARD_PADDING } from '@/components/home/ProductCard'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function RecentlyViewedScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const products = useRecentlyViewedStore((state) => state.products)

  const renderProduct = useCallback(
    ({ item }: { item: RecentlyViewedProduct }) => <ProductCard product={item} />,
    []
  )

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('recentlyViewed.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {products.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState icon={Clock} message={t('recentlyViewed.empty')} />
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={{ gap: CARD_GAP }}
            contentContainerStyle={{
              paddingHorizontal: CARD_PADDING,
              gap: CARD_GAP,
              paddingBottom: 16,
              paddingTop: 8,
            }}
          />
        )}
      </SafeAreaView>
    </>
  )
}
