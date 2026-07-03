import React, { useEffect, useRef, useState } from 'react'
import { View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react-native'
import { AppText } from '@/components/ui'
import { ProgressBar } from '@/components/ui'
import { InlineError } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import {
  useActiveFlashSale,
  useFlashSaleProducts,
  useRefetchActiveFlashSale,
} from '@/hooks/useFlashSaleApi'
import { formatPrice } from '@/utils/price'
import type { FlashSaleProduct } from '@/apis/flashSale.api'

// ─── Countdown ────────────────────────────────────────────────────────────────

function getSecondsUntil(endTimeIso: string): number {
  const diff = Math.floor((new Date(endTimeIso).getTime() - Date.now()) / 1000)
  return Math.max(0, diff)
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

// ─── Flash Product Card ───────────────────────────────────────────────────────

const CARD_WIDTH = 120

function FlashProductCard({ item }: { item: FlashSaleProduct }) {
  const { t } = useTranslation()
  const colors = useColors()
  const soldPct =
    item.total_quantity > 0 ? Math.round((item.sold_quantity / item.total_quantity) * 100) : 0

  return (
    <View
      style={{
        width: CARD_WIDTH,
        marginRight: 10,
        backgroundColor: colors.neutrals800,
        borderRadius: 8,
        padding: 8,
      }}
      accessibilityLabel={t('flashSale.a11y.productCard', { price: item.flash_price })}>
      {/* Flash price */}
      <AppText raw variant="bodySmall" weight="semibold" style={{ color: colors.primary }}>
        {formatPrice(item.flash_price)}
      </AppText>
      {/* Original price */}
      <AppText
        raw
        variant="labelSmall"
        color="muted"
        style={{ textDecorationLine: 'line-through', marginBottom: 6 }}>
        {formatPrice(item.original_price)}
      </AppText>
      {/* Sold / stock progress */}
      <ProgressBar value={soldPct} variant="primary" size="sm" />
      <AppText raw variant="labelSmall" color="muted" style={{ marginTop: 2 }}>
        {t('flashSale.sold', { count: item.sold_quantity })}
      </AppText>
    </View>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function FlashSaleSection() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const refetchActive = useRefetchActiveFlashSale()

  const { data: sales, isLoading, isError, refetch } = useActiveFlashSale()

  // Use the first active sale
  const activeSale = sales && sales.length > 0 ? sales[0] : null

  const { data: products } = useFlashSaleProducts(activeSale?._id ?? '')

  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    activeSale ? getSecondsUntil(activeSale.endTime) : 0
  )

  // Sync secondsLeft when activeSale changes
  const endTimeRef = useRef<string | null>(null)
  useEffect(() => {
    if (!activeSale) {
      setSecondsLeft(0)
      return
    }
    if (endTimeRef.current !== activeSale.endTime) {
      endTimeRef.current = activeSale.endTime
      setSecondsLeft(getSecondsUntil(activeSale.endTime))
    }
  }, [activeSale])

  // Tick every second; refetch active sale when countdown reaches zero
  useEffect(() => {
    if (!activeSale) return
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          refetchActive()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [activeSale, refetchActive])

  // Loading state
  if (isLoading) {
    return (
      <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  // Error state
  if (isError) {
    return (
      <View style={{ paddingHorizontal: 16 }}>
        <InlineError message={t('flashSale.errorLoad')} onRetry={() => refetch()} />
      </View>
    )
  }

  // No active sale
  if (!activeSale) return null

  return (
    <View style={{ paddingVertical: 12 }}>
      {/* Header row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          marginBottom: 10,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Zap size={18} color={colors.primary} fill={colors.primary} />
          <AppText raw variant="heading4" weight="bold" style={{ color: colors.primary }}>
            {activeSale.name || t('flashSale.header.title')}
          </AppText>
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginLeft: 4,
            }}>
            <AppText
              raw
              variant="labelSmall"
              style={{ color: colors.primaryForeground, fontVariant: ['tabular-nums'] }}>
              {formatCountdown(secondsLeft)}
            </AppText>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/flash-sale?id=${activeSale._id}`)}
          accessibilityRole="link">
          <AppText raw variant="bodySmall" style={{ color: colors.primary }}>
            {t('flashSale.viewAll')}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Product rail */}
      {products && products.length > 0 ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.product_id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => <FlashProductCard item={item} />}
        />
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          <AppText raw variant="bodySmall" color="muted">
            {t('flashSale.noProducts')}
          </AppText>
        </View>
      )}
    </View>
  )
}
