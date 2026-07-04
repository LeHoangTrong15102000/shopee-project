import React from 'react'
import { View, FlatList } from 'react-native'
import { AppText } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'
import ProductCard from '@/components/home/ProductCard'
import type { ProductCardProduct } from '@/components/home/ProductCard'
import type { Bundle } from '@/apis/bundles.api'

// ─── Bought-Together Rail ────────────────────────────────────────────────────

interface BoughtTogetherSectionProps {
  products: ProductCardProduct[]
}

export function BoughtTogetherSection({ products }: BoughtTogetherSectionProps) {
  const { t } = useTranslation()

  // Hidden on empty or error (fail-safe — design.md decision 2)
  if (products.length === 0) return null

  return (
    <View className="py-3">
      <AppText raw variant="heading4" weight="bold" className="mb-3 px-4">
        {t('PD_BOUGHT_TOGETHER')}
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

// ─── Bundle Upsell ───────────────────────────────────────────────────────────

/**
 * Formats the bundle discount label from the API's discountType + discountValue.
 * The backend returns raw/unpopulated productIds — individual product prices are
 * not available here. Fetching per-product is out of scope; showing name + discount
 * only is the chosen safe option (see tasks.md 3.2 gap note).
 */
function formatBundleDiscount(
  discountType: Bundle['discountType'],
  discountValue: number,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  if (discountType === 'percentage') {
    return t('PD_BUNDLE_SAVE_PERCENT', { value: discountValue })
  }
  if (discountType === 'fixed') {
    return t('PD_BUNDLE_SAVE_FIXED', { value: discountValue })
  }
  // buy_x_get_y — express as "Buy {{min}} get discount"
  return t('PD_BUNDLE_BUY_X_GET_Y', { min: discountValue })
}

interface BundleCardProps {
  bundle: Bundle
}

function BundleCard({ bundle }: BundleCardProps) {
  const colors = useColors()
  const { t } = useTranslation()

  const discountLabel = formatBundleDiscount(bundle.discountType, bundle.discountValue, t)
  const itemCount = bundle.productIds.length

  return (
    <View
      className="rounded-lg p-3"
      style={{
        backgroundColor: colors.neutrals800,
        minWidth: 200,
        maxWidth: 260,
      }}>
      <AppText raw variant="bodySmall" weight="semibold" numberOfLines={2} className="mb-1">
        {bundle.name}
      </AppText>
      <AppText raw variant="labelSmall" color="muted" className="mb-2">
        {t('PD_BUNDLE_ITEM_COUNT', { count: itemCount })}
      </AppText>
      <View className="self-start rounded px-2 py-0.5" style={{ backgroundColor: colors.primary }}>
        <AppText raw variant="labelSmall" style={{ color: colors.primaryForeground }}>
          {discountLabel}
        </AppText>
      </View>
    </View>
  )
}

interface BundleUpsellSectionProps {
  bundles: Bundle[]
}

export function BundleUpsellSection({ bundles }: BundleUpsellSectionProps) {
  const { t } = useTranslation()

  // Hidden on empty or error (fail-safe — design.md decision 2)
  if (bundles.length === 0) return null

  return (
    <View className="py-3">
      <AppText raw variant="heading4" weight="bold" className="mb-3 px-4">
        {t('PD_BUNDLE_TITLE')}
      </AppText>
      <FlatList
        data={bundles}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item }) => <BundleCard bundle={item} />}
      />
    </View>
  )
}
