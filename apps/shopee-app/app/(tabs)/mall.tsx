import React from 'react'
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import ProductCard, { CARD_GAP } from '@/components/home/ProductCard'
import { Product, Category } from '@/types/product.type'

const SCREEN_WIDTH = Dimensions.get('window').width

export default function MallScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()

  const { data: categoriesData, isLoading: catsLoading } = useCategories()
  const { data: productsData, isLoading: prodsLoading } = useProducts()

  const categories = (categoriesData ?? []) as Category[]
  const featuredProducts = (productsData?.products ?? []).slice(0, 10) as Product[]

  const banners = [
    { id: '1', label: t('mall.banner.superSale'), color: '#EE4D2D' },
    { id: '2', label: t('mall.banner.flashSale'), color: '#FF6D00' },
    { id: '3', label: t('mall.banner.freeShipping'), color: '#FF8F00' },
  ]

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}>
          <AppText raw variant="heading2" style={{ color: '#fff', fontWeight: 'bold' }}>
            Shopee Mall
          </AppText>
          <AppText
            raw
            variant="labelSmall"
            style={{ color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            {t('mall.section.authentic')}
          </AppText>
        </View>

        {/* Promotional banners */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
          {banners.map((banner) => (
            <View
              key={banner.id}
              style={{
                width: SCREEN_WIDTH * 0.75,
                height: 120,
                borderRadius: 12,
                backgroundColor: banner.color,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 16,
              }}>
              <AppText
                raw
                variant="body"
                style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                {banner.label}
              </AppText>
            </View>
          ))}
        </ScrollView>

        {/* Categories grid */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <AppText raw variant="body" weight="semibold" style={{ marginBottom: 12 }}>
            {t('mall.section.categories')}
          </AppText>
          {catsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.slice(0, 8).map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  onPress={() =>
                    router.push({
                      pathname: '/search',
                      params: { category: cat._id, categoryName: cat.name },
                    })
                  }
                  style={{
                    width: (SCREEN_WIDTH - 32 - 24) / 4,
                    alignItems: 'center',
                    gap: 6,
                  }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: colors.primary + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <AppText raw variant="body" style={{ color: colors.primary, fontSize: 20 }}>
                      🛍
                    </AppText>
                  </View>
                  <AppText
                    raw
                    variant="labelSmall"
                    numberOfLines={2}
                    style={{ textAlign: 'center', color: colors.foreground }}>
                    {cat.name}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Featured products */}
        <View style={{ paddingHorizontal: 16 }}>
          <AppText raw variant="body" weight="semibold" style={{ marginBottom: 12 }}>
            {t('mall.section.featured')}
          </AppText>
          {prodsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: CARD_GAP,
              }}>
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
