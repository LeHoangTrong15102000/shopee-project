import React, { useCallback } from 'react'
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { Heart, Star } from 'lucide-react-native'
import { AppText, EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist'
import { formatPrice, getDiscountPercent } from '@/utils/price'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

const CARD_GAP = 8
const CARD_PADDING = 16
const CARD_WIDTH = (Dimensions.get('window').width - CARD_PADDING * 2 - CARD_GAP) / 2

export default function WishlistScreen() {
  const colors = useColors()
  const router = useRouter()

  const { data, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useWishlist()
  const { mutate: removeFromWishlist } = useRemoveFromWishlist()

  const allProducts = data?.pages.flatMap((p) => p.data.items) ?? []

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
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
            <Image
              source={{ uri: product.image }}
              style={{ width: CARD_WIDTH, height: CARD_WIDTH, resizeMode: 'cover' }}
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
              accessibilityLabel="Bỏ yêu thích">
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
                <AppText raw variant="labelSmall" style={{ color: '#fff', fontSize: 10 }}>
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
              <View className="flex-row items-center gap-1 mt-1">
                <Star size={10} color="#f59e0b" fill="#f59e0b" />
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
          title: 'Yêu thích',
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
              message="Chưa có sản phẩm yêu thích"
              actionLabel="Khám phá sản phẩm"
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
