import React from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { Search } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import ProductCard, { CARD_GAP } from '@/components/home/ProductCard'
import type { Product } from '@/types/product.type'

interface SearchResultsProps {
  products: Product[]
  isLoading?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
}

export default function SearchResults({
  products,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
}: SearchResultsProps) {
  const { t } = useTranslation()
  const colors = useColors()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (products.length === 0) {
    return <EmptyState icon={Search} message={t('search.empty.message')} />
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={{ gap: CARD_GAP, paddingHorizontal: 16, paddingTop: 8 }}
      contentContainerStyle={{ paddingBottom: 16 }}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
        ) : null
      }
      renderItem={({ item }) => <ProductCard product={item} />}
    />
  )
}
