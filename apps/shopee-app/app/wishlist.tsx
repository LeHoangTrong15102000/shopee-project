import React, { useCallback } from 'react'
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native'
import AppImage from '@/components/ui/AppImage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { Heart, Star, Trash2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useWishlist, useRemoveFromWishlist, useClearWishlist } from '@/hooks/useWishlist'
import { formatPrice, getDiscountPercent } from '@/utils/price'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { WishlistItem } from '@/apis/wishlist.api'

const CARD_GAP = 8
const CARD_PADDING = 16
const CARD_WIDTH = (Dimensions.get('window').width - CARD_PADDING * 2 - CARD_GAP) / 2

export default function WishlistScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()

  const { data, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useWishlist()
  const { mutate: removeFromWishlist } = useRemoveFromWishlist()
  const { mutate: clearWishlist, isPending: isClearing } = useClearWishlist()

  const allProducts = data?.pages.flatMap((p) => p.data.items) ?? []

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const handleClearAll = () => {
    Alert.alert(t('wishlist.confirm.clearAll'), t('wishlist.confirm.clearAllMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('wishlist.button.clearAll'),
        style: 'destructive',
        onPress: () => clearWishlist(),
      },
    ])
  }

  const renderItem = useCallback(
    ({ item }: { item: WishlistItem }) => {
      const product = item.product
      const discount = getDiscountPercent(product.price, product.price_before_discount)

      return (
        <TouchableOpacity
          style={{ width: CARD_WIDTH }}
          onPress={() => router.push(`/product/${product._id}`)}>
          <View
            style={{
              backgroundColor: colors.neutrals1000,
              borderRadius: 8,
              overflow: 'hidden',
              position: 'relative',
            }}>
            <AppImage
              source={{ uri: product.image }}
              style={{ width: CARD_WIDTH, height: CARD_WIDTH }}
              contentFit="cover"
            />

            {/* Remove from wishlist button */}
            <TouchableOpacity
              onPress={() => removeFromWishlist(product._id)}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: 'rgba(0,0,0,0.4)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel={t('wishlist.button.remove')}>
              <Heart size={16} color={colors.primary} fill={colors.primary} />
            </TouchableOpacity>

            {discount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}>
                <AppText
                  raw
                  variant="labelSmall"
                  style={{ color: colors.primaryForeground, fontSize: 10 }}>
                  -{discount}%
                </AppText>
              </View>
            )}
          </View>

          <View style={{ padding: 8 }}>
            <AppText raw variant="bodySmall" numberOfLines={2} style={{ marginBottom: 4 }}>
              {product.name}
            </AppText>
            <AppText raw variant="bodySmall" weight="semibold" color="primary">
              {formatPrice(product.price)}
            </AppText>
            {product.rating > 0 && (
              <View className="mt-1 flex-row items-center gap-1">
                <Star size={10} color={colors.warning} fill={colors.warning} />
                <AppText raw variant="labelSmall" color="muted">
                  {product.rating.toFixed(1)}
                </AppText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )
    },
    [removeFromWishlist, colors, router]
  )

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('wishlist.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : allProducts.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState
              icon={Heart}
              message={t('wishlist.empty.message')}
              actionLabel={t('wishlist.empty.action')}
              onAction={() => router.push('/(tabs)/home')}
            />
          </View>
        ) : (
          <FlatList
            data={allProducts}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={{ gap: CARD_GAP, paddingHorizontal: CARD_PADDING, paddingTop: 8 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  paddingHorizontal: CARD_PADDING,
                  paddingTop: 8,
                }}>
                <TouchableOpacity
                  onPress={handleClearAll}
                  disabled={isClearing}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('wishlist.button.clearAll')}>
                  <Trash2 size={16} color={colors.error} />
                  <AppText raw variant="bodySmall" style={{ color: colors.error }}>
                    {t('wishlist.button.clearAll')}
                  </AppText>
                </TouchableOpacity>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginVertical: 16 }}
                />
              ) : null
            }
            renderItem={renderItem}
          />
        )}
      </SafeAreaView>
    </>
  )
}
