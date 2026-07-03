import React, { useCallback, useMemo, useState } from 'react'
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ShoppingBag } from 'lucide-react-native'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { InlineError, EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import {
  SearchHeader,
  BannerCarousel,
  CategoryBar,
  ProductCard,
  CARD_GAP,
  CARD_PADDING,
  BannerSkeleton,
  CategorySkeleton,
  ProductCardSkeleton,
} from '@/components/home'
import FlashSaleSection from '@/components/home/FlashSaleSection'
import RecentlyViewedSection from '@/components/home/RecentlyViewedSection'
import CmsBlockRenderer from '@/components/home/CmsBlockRenderer'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import { useHomepageContent } from '@/hooks/useCmsPages'
import { Product } from '@/types/product.type'

const FEATURE_FLAG_KEYS = ['flash_sale_enabled'] as const

export default function HomeScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchProducts,
  } = useProducts(selectedCategory)

  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategories()

  const flags = useFeatureFlags([...FEATURE_FLAG_KEYS])
  const flashSaleEnabled = flags['flash_sale_enabled'] === true

  const { data: homepageCms } = useHomepageContent()

  const products = productsData?.products ?? []

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchProducts(), refetchCategories()])
    setRefreshing(false)
  }, [refetchProducts, refetchCategories])

  const handleCategorySelect = useCallback((categoryId?: string) => {
    setSelectedCategory(categoryId)
  }, [])

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    []
  )

  const ListHeader = useMemo(
    () => (
      <>
        {/* CMS homepage blocks — rendered above static layout; falls back to nothing on 404 */}
        {homepageCms && homepageCms.blocks.length > 0 && (
          <CmsBlockRenderer blocks={homepageCms.blocks} />
        )}

        {/* Banner */}
        {productsLoading ? <BannerSkeleton /> : <BannerCarousel />}

        {/* Flash Sale — gated behind feature flag */}
        {!productsLoading && flashSaleEnabled && <FlashSaleSection />}

        {/* Recently Viewed */}
        {!productsLoading && <RecentlyViewedSection />}

        {/* Categories */}
        {categoriesLoading ? (
          <CategorySkeleton />
        ) : categoriesError ? (
          <InlineError message={t('ERROR_LOAD_CATEGORIES')} onRetry={() => refetchCategories()} />
        ) : (
          <CategoryBar
            categories={categories ?? []}
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
          />
        )}

        {/* Product error state */}
        {productsError && !productsLoading && (
          <InlineError message={t('ERROR_LOAD_PRODUCTS')} onRetry={() => refetchProducts()} />
        )}

        {/* Product empty state */}
        {!productsLoading && !productsError && products.length === 0 && (
          <EmptyState
            icon={ShoppingBag}
            message={t('EMPTY_PRODUCTS')}
            actionLabel={t('EMPTY_PRODUCTS_CTA')}
            onAction={() => setSelectedCategory(undefined)}
          />
        )}
      </>
    ),
    [
      homepageCms,
      productsLoading,
      flashSaleEnabled,
      categoriesLoading,
      categoriesError,
      productsError,
      products.length,
      categories,
      selectedCategory,
      handleCategorySelect,
      refetchCategories,
      refetchProducts,
      t,
    ]
  )

  const ListFooter = isFetchingNextPage ? (
    <View className="items-center py-4">
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : null

  // Skeleton grid for initial load
  if (productsLoading) {
    return (
      <View className="flex-1 bg-background">
        <SearchHeader />
        {ListHeader}
        <View
          className="flex-row flex-wrap"
          style={{ paddingHorizontal: CARD_PADDING, gap: CARD_GAP }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <SearchHeader />
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
        }}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  )
}
