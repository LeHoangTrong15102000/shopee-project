import React, { useCallback } from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react-native'
import { EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useFlashSale } from '@/hooks/useFlashSale'
import ProductCard, { CARD_GAP, CARD_PADDING } from '@/components/home/ProductCard'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { Product } from '@/types/product.type'

export default function FlashSaleScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const { data: products, isLoading } = useFlashSale()

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    []
  )

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('flashSale.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !products || products.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState icon={Zap} message={t('EMPTY_PRODUCTS')} />
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
