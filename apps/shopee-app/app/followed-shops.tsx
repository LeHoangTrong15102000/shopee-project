import React, { useState } from 'react'
import { View, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Store } from 'lucide-react-native'
import { EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useFollowedShopsList, useUnfollowShop } from '@/hooks/useFollowedShops'
import FollowedShopCard from '@/components/shop/FollowedShopCard'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { type FollowedShop } from '@/store/followedShopsStore'

export default function FollowedShopsScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const shops = useFollowedShopsList()
  const { mutate: unfollowShop } = useUnfollowShop()
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null)

  const handleUnfollow = (shopId: string) => {
    setUnfollowingId(shopId)
    unfollowShop(shopId, {
      onSettled: () => setUnfollowingId(null),
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('followedShops.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {shops.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState icon={Store} message={t('followedShops.empty')} />
          </View>
        ) : (
          <FlatList
            data={shops}
            keyExtractor={(item: FollowedShop) => item._id}
            renderItem={({ item }: { item: FollowedShop }) => (
              <FollowedShopCard
                shop={item}
                onUnfollow={handleUnfollow}
                isUnfollowing={unfollowingId === item._id}
              />
            )}
            ListFooterComponent={<View style={{ height: 16 }} />}
          />
        )}
      </SafeAreaView>
    </>
  )
}
