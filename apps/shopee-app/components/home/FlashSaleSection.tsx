import React, { useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react-native'
import { AppText, AppImage } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useFlashSale } from '@/hooks/useFlashSale'
import { formatPrice, getDiscountPercent } from '@/utils/price'
import { Product } from '@/types/product.type'

const CARD_WIDTH = 120
const CARD_HEIGHT = 120

// Flash sale ends at midnight each day
function getSecondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function FlashProductCard({ product }: { product: Product }) {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const discount = getDiscountPercent(product.price, product.price_before_discount)

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product._id}`)}
      activeOpacity={0.8}
      style={{ width: CARD_WIDTH, marginRight: 10 }}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.viewProduct', { name: product.name })}>
      <View
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: colors.neutrals900,
        }}>
        <AppImage
          source={{ uri: product.image }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        {discount > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.primary,
              paddingVertical: 2,
              alignItems: 'center',
            }}>
            <AppText raw variant="labelSmall" style={{ color: colors.primaryForeground }}>
              -{discount}%
            </AppText>
          </View>
        )}
      </View>
      <View style={{ marginTop: 4 }}>
        <AppText raw variant="bodySmall" weight="semibold" style={{ color: colors.primary }}>
          {formatPrice(product.price)}
        </AppText>
        {discount > 0 && (
          <AppText
            raw
            variant="labelSmall"
            color="muted"
            style={{ textDecorationLine: 'line-through' }}>
            {formatPrice(product.price_before_discount)}
          </AppText>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function FlashSaleSection() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { data: products } = useFlashSale()
  const [secondsLeft, setSecondsLeft] = useState(getSecondsUntilMidnight)

  useEffect(() => {
    if (!products || products.length === 0) return
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [products])

  if (!products || products.length === 0) return null

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
            {t('flashSale.header.title')}
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
        <TouchableOpacity onPress={() => router.push('/flash-sale')} accessibilityRole="link">
          <AppText raw variant="bodySmall" style={{ color: colors.primary }}>
            {t('flashSale.viewAll')}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Product list */}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => <FlashProductCard product={item} />}
      />
    </View>
  )
}
