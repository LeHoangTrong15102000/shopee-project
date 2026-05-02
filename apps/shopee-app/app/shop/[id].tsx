import React, { useState } from 'react'
import { View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useShop } from '@/hooks/useShop'
import { useShopProducts } from '@/hooks/useShopProducts'
import { useFollowShop } from '@/hooks/useFollowShop'
import { useAuthStore } from '@/store/authStore'
import ShopHeader from '@/components/shop/ShopHeader'
import ShopProductGrid from '@/components/shop/ShopProductGrid'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

type TabKey = 'products' | 'categories' | 'newest'

const TAB_KEYS: TabKey[] = ['products', 'categories', 'newest']

const TAB_SORT: Record<TabKey, string> = {
  products: 'sold',
  categories: 'category',
  newest: 'createdAt',
}

export default function ShopScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabKey>('products')
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const { data: shop, isLoading: shopLoading, isError: shopError, refetch: refetchShop } = useShop(id)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: productsLoading,
  } = useShopProducts(id, TAB_SORT[activeTab])
  const { mutate: toggleFollow, isPending: followLoading } = useFollowShop(id)

  const handleFollow = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (shop) toggleFollow(shop.isFollowing)
  }

  if (shopLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Skeleton header cover */}
        <View style={{ height: 160, backgroundColor: colors.neutrals800 }} />
        <View className="px-4 pb-4" style={{ backgroundColor: colors.background }}>
          <View style={{ marginTop: -32 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.neutrals700,
              }}
            />
          </View>
          <View
            style={{ height: 20, width: '50%', borderRadius: 4, backgroundColor: colors.neutrals700, marginTop: 12 }}
          />
          <View
            style={{ height: 14, width: '80%', borderRadius: 4, backgroundColor: colors.neutrals700, marginTop: 8 }}
          />
          <View className="flex-row gap-4 mt-3">
            <View style={{ height: 14, width: 60, borderRadius: 4, backgroundColor: colors.neutrals700 }} />
            <View style={{ height: 14, width: 80, borderRadius: 4, backgroundColor: colors.neutrals700 }} />
          </View>
        </View>
      </View>
    )
  }

  if (shopError) {
    return (
      <View className="flex-1 items-center justify-center px-4 gap-3">
        <AppText raw variant="body" color="muted" align="center">
          {t('shop.error.loadFailed')}
        </AppText>
        <AppButton variant="outline" size="sm" onPress={() => refetchShop()}>
          {t('RETRY')}
        </AppButton>
      </View>
    )
  }

  const products = data?.products ?? []

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: shop.name,
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <ShopHeader
            shop={shop}
            isFollowing={shop.isFollowing}
            onFollow={handleFollow}
            followLoading={followLoading}
          />

          {/* Tab bar */}
          <View
            className="flex-row border-b"
            style={{ borderColor: colors.neutrals700, backgroundColor: colors.background }}>
            {TAB_KEYS.map((tabKey) => {
              const isActive = activeTab === tabKey
              return (
                <TouchableOpacity
                  key={tabKey}
                  onPress={() => setActiveTab(tabKey)}
                  className="flex-1 items-center py-3"
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}>
                  <AppText
                    raw
                    variant="bodySmall"
                    weight={isActive ? 'semibold' : 'regular'}
                    style={{ color: isActive ? colors.primary : colors.neutrals400 }}>
                    {t(`shop.tabs.${tabKey}`)}
                  </AppText>
                  {isActive && (
                    <View
                      className="absolute bottom-0 h-0.5 w-full"
                      style={{ backgroundColor: colors.primary }}
                    />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Product grid */}
          <View className="pt-3">
            {productsLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <ShopProductGrid
                products={products}
                onEndReached={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={!!hasNextPage}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
