import React from 'react'
import { View, FlatList } from 'react-native'
import { AppText } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import ProductCard from '@/components/home/ProductCard'
import type { ProductCardProduct } from '@/components/home/ProductCard'

interface SimilarProductsProps {
  products: ProductCardProduct[]
}

export default function SimilarProducts({ products }: SimilarProductsProps) {
  const { t } = useTranslation()

  // Hidden on empty or error (fail-safe — design.md decision 2)
  if (products.length === 0) return null

  return (
    <View className="py-3">
      <AppText raw variant="heading4" weight="bold" className="mb-3 px-4">
        {t('PD_SIMILAR_PRODUCTS')}
      </AppText>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  )
}
