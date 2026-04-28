import React from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Coins } from 'lucide-react-native'
import { useQuery } from '@tanstack/react-query'
import { AppText, EmptyState, SkeletonLoader } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useXuHistory } from '@/hooks/useXuHistory'
import { type XuTransaction, getXuPoints } from '@/apis/xu.api'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

function XuTransactionItem({ item }: { item: XuTransaction }) {
  const colors = useColors()

  const amountColor =
    item.type === 'earned' ? colors.success : item.type === 'spent' ? colors.error : colors.neutrals400
  const amountPrefix = item.type === 'earned' ? '+' : '-'
  const absAmount = Math.abs(item.amount)

  const formattedDate = new Date(item.date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const typeLabel =
    item.type === 'earned' ? 'Nhận' : item.type === 'spent' ? 'Dùng' : 'Hết hạn'
  const typeBgColor =
    item.type === 'earned' ? colors.success : item.type === 'spent' ? colors.error : colors.neutrals600

  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <View
            style={{
              backgroundColor: typeBgColor,
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}>
            <AppText raw variant="labelSmall" style={{ color: '#fff' }}>
              {typeLabel}
            </AppText>
          </View>
        </View>
        <AppText raw variant="bodySmall" numberOfLines={2}>
          {item.description}
        </AppText>
        <AppText raw variant="labelSmall" color="muted">
          {formattedDate}
        </AppText>
      </View>
      <AppText raw variant="body" weight="semibold" style={{ color: amountColor }}>
        {amountPrefix}{absAmount} Xu
      </AppText>
    </View>
  )
}

function XuSkeletonList() {
  return (
    <View className="px-4 py-3 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="flex-row items-center justify-between">
          <View className="gap-2 flex-1">
            <SkeletonLoader width={60} height={18} borderRadius={4} />
            <SkeletonLoader width="80%" height={14} borderRadius={4} />
            <SkeletonLoader width={80} height={12} borderRadius={4} />
          </View>
          <SkeletonLoader width={70} height={20} borderRadius={4} />
        </View>
      ))}
    </View>
  )
}

export default function XuHistoryScreen() {
  const colors = useColors()
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useXuHistory()
  const { data: pointsData } = useQuery({
    queryKey: ['xu-points'],
    queryFn: getXuPoints,
  })

  const allPages = data?.pages ?? []
  const transactions = allPages.flatMap((p) => p.transactions)
  // Use balance from the points API (transactions endpoint does not return balance)
  const balance = pointsData?.available_points

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Lịch sử Xu',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Balance header */}
        <View
          style={{ backgroundColor: colors.coin }}
          className="items-center px-4 py-6">
          <AppText raw variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Lịch sử giao dịch Xu
          </AppText>
          {balance !== undefined && (
            <AppText
              raw
              variant="heading"
              weight="bold"
              style={{ color: '#fff', fontSize: 32, marginTop: 4 }}>
              {balance.toLocaleString('vi-VN')} Xu
            </AppText>
          )}
        </View>

        {isLoading ? (
          <XuSkeletonList />
        ) : transactions.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState icon={Coins} message="Chưa có giao dịch Xu nào" />
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <XuTransactionItem item={item} />}
            ItemSeparatorComponent={() => <View className="h-px bg-neutrals900" />}
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
          />
        )}
      </SafeAreaView>
    </>
  )
}
