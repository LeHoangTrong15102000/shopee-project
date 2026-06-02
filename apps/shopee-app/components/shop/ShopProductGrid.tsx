import React from 'react'
import { FlatList, ActivityIndicator, View } from 'react-native'
import { ShoppingBag } from 'lucide-react-native'
import ProductCard, { CARD_GAP, CARD_PADDING } from '@/components/home/ProductCard'
import EmptyState from '@/components/ui/EmptyState'
import { useColors } from '@/hooks/useColors'
import { Product } from '@/types/product.type'

interface ShopProductGridProps {
  products: Product[]
  onEndReached: () => void
  isFetchingNextPage: boolean
  hasNextPage: boolean
}

export default function ShopProductGrid({
  products,
  onEndReached,
  isFetchingNextPage,
  hasNextPage,
}: ShopProductGridProps) {
  const colors = useColors()

  if (products.length === 0) {
    return <EmptyState icon={ShoppingBag} message="Cửa hàng chưa có sản phẩm nào" />
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={{ gap: CARD_GAP, paddingHorizontal: CARD_PADDING }}
      contentContainerStyle={{ gap: CARD_GAP, paddingBottom: 24 }}
      renderItem={({ item }) => <ProductCard product={item} />}
      onEndReached={hasNextPage ? onEndReached : undefined}
      onEndReachedThreshold={0.3}
      scrollEnabled={false}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
    />
  )
}
