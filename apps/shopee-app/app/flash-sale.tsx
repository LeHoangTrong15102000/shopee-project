import React, { useCallback } from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react-native'
import { EmptyState, InlineError, AppText } from '@/components/ui'
import { ProgressBar } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useFlashSaleDetail, useFlashSaleProducts } from '@/hooks/useFlashSaleApi'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { formatPrice } from '@/utils/price'
import type { FlashSaleProduct } from '@/apis/flashSale.api'

// ─── Product card ─────────────────────────────────────────────────────────────

const CARD_WIDTH = 160

function FlashDetailCard({ item }: { item: FlashSaleProduct }) {
  const { t } = useTranslation()
  const colors = useColors()
  const soldPct =
    item.total_quantity > 0 ? Math.round((item.sold_quantity / item.total_quantity) * 100) : 0

  return (
    <View
      style={{
        width: CARD_WIDTH,
        backgroundColor: colors.neutrals800,
        borderRadius: 8,
        padding: 10,
        margin: 4,
      }}
      accessibilityLabel={t('flashSale.a11y.productCard', { price: item.flash_price })}>
      {/* Flash price */}
      <AppText raw variant="body" weight="semibold" style={{ color: colors.primary }}>
        {formatPrice(item.flash_price)}
      </AppText>
      {/* Original price */}
      <AppText
        raw
        variant="bodySmall"
        color="muted"
        style={{ textDecorationLine: 'line-through', marginBottom: 8 }}>
        {formatPrice(item.original_price)}
      </AppText>
      {/* Sold / stock progress */}
      <ProgressBar value={soldPct} variant="primary" size="sm" />
      <AppText raw variant="labelSmall" color="muted" style={{ marginTop: 4 }}>
        {t('flashSale.sold', { count: item.sold_quantity })}
      </AppText>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FlashSaleScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const { id } = useLocalSearchParams<{ id?: string }>()

  const {
    data: saleDetail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useFlashSaleDetail(id ?? '')

  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useFlashSaleProducts(id ?? '')

  const isLoading = detailLoading || productsLoading
  const isError = detailError || productsError

  const screenTitle = saleDetail?.name ?? t('flashSale.header.title')

  const renderProduct = useCallback(
    ({ item }: { item: FlashSaleProduct }) => <FlashDetailCard item={item} />,
    []
  )

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: screenTitle,
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-4">
            <InlineError
              message={t('flashSale.errorLoad')}
              onRetry={() => {
                refetchDetail()
                refetchProducts()
              }}
            />
          </View>
        ) : !products || products.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState icon={Zap} message={t('flashSale.noProducts')} />
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.product_id}
            numColumns={2}
            contentContainerStyle={{
              paddingHorizontal: 8,
              paddingBottom: 16,
              paddingTop: 8,
            }}
          />
        )}
      </SafeAreaView>
    </>
  )
}
