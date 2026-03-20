import React, { useCallback, useState } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShoppingBag } from 'lucide-react-native';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { InlineError, EmptyState } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
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
} from '@/components/home';
import { Product } from '@/services/product.api';

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchProducts,
  } = useProducts(selectedCategory);

  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  const products = productsData?.products ?? [];

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProducts(), refetchCategories()]);
    setRefreshing(false);
  }, [refetchProducts, refetchCategories]);

  const handleCategorySelect = useCallback((categoryId?: string) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    []
  );

  const ListHeader = (
    <>
      {/* Banner */}
      {productsLoading ? <BannerSkeleton /> : <BannerCarousel />}

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
  );

  const ListFooter = isFetchingNextPage ? (
    <View className="items-center py-4">
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : null;

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
    );
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
  );
}
