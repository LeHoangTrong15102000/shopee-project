import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText, EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import ProductCard, { CARD_GAP, CARD_PADDING } from '@/components/home/ProductCard'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { ShoppingBag } from 'lucide-react-native'
import { Category } from '@/types/product.type'
import { Product } from '@/types/product.type'

export default function CategoriesScreen() {
  const { t } = useTranslation()
  const colors = useColors()

  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()

  // Default-select first category on mount
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0])
    }
  }, [categories])

  const {
    data: productsData,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProducts(selectedCategory?._id)

  const products = productsData?.products ?? []

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    []
  )

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('categories.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {categoriesLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {/* Left sidebar — category list */}
            <ScrollView
              style={{ width: 100, borderRightWidth: 1, borderRightColor: colors.neutrals800 }}
              showsVerticalScrollIndicator={false}>
              {(categories ?? []).map((cat) => {
                const isSelected = selectedCategory?._id === cat._id
                return (
                  <TouchableOpacity
                    key={cat._id}
                    onPress={() => setSelectedCategory(cat)}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      backgroundColor: isSelected ? colors.neutrals900 : 'transparent',
                      borderLeftWidth: isSelected ? 3 : 0,
                      borderLeftColor: colors.primary,
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}>
                    <AppText
                      raw
                      variant="bodySmall"
                      weight={isSelected ? 'semibold' : 'regular'}
                      style={{ color: isSelected ? colors.primary : colors.foreground }}
                      numberOfLines={2}>
                      {cat.name}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {/* Right panel — products grid filtered by selected category.
                NOTE: The backend Category model is flat (no parent/children hierarchy),
                so a true subcategory drill-down is not possible. Instead we show products
                belonging to the selected top-level category. Tapping a product card
                navigates to the product detail screen via ProductCard's built-in onPress. */}
            {productsLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : products.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState icon={ShoppingBag} message={t('EMPTY_PRODUCTS')} />
              </View>
            ) : (
              <FlatList
                style={{ flex: 1 }}
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
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isFetchingNextPage ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                      style={{ marginVertical: 16 }}
                    />
                  ) : null
                }
              />
            )}
          </View>
        )}
      </SafeAreaView>
    </>
  )
}
