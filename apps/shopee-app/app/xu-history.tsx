import React, { useState } from 'react'
import { View, FlatList, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Coins } from 'lucide-react-native'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AppText, Chip, EmptyState, SkeletonLoader } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useXuHistory } from '@/hooks/useXuHistory'
import { useLoyaltyRewards, useRedeemReward } from '@/hooks/useLoyaltyRewards'
import { type XuTransaction, getXuPoints } from '@/apis/xu.api'
import { useToast } from '@/components/ui/ToastProvider'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import RewardCard from '@/components/loyalty/RewardCard'

type TabKey = 'history' | 'rewards'

function XuTransactionItem({ item }: { item: XuTransaction }) {
  const colors = useColors()
  const { t, i18n } = useTranslation()

  const amountColor =
    item.type === 'earned' ? colors.success : item.type === 'spent' ? colors.error : colors.neutrals400
  const amountPrefix = item.type === 'earned' ? '+' : '-'
  const absAmount = Math.abs(item.amount)

  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US'
  const formattedDate = new Date(item.date).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const typeLabel =
    item.type === 'earned'
      ? t('xuHistory.transaction.earned')
      : item.type === 'spent'
        ? t('xuHistory.transaction.spent')
        : t('xuHistory.transaction.expired')
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
  const { t, i18n } = useTranslation()
  const { showSuccess } = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>('history')
  const [redeemingId, setRedeemingId] = useState<string | null>(null)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useXuHistory()
  const { data: pointsData } = useQuery({
    queryKey: ['xu-points'],
    queryFn: getXuPoints,
  })
  const { data: rewardsData, isLoading: isLoadingRewards } = useLoyaltyRewards()
  const { mutate: redeemReward } = useRedeemReward()

  const allPages = data?.pages ?? []
  const transactions = allPages.flatMap((p) => p.transactions)
  const balance = pointsData?.available_points ?? 0
  const rewards = (rewardsData?.data as unknown as import('@/apis/xu.api').LoyaltyReward[]) ?? []

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const handleRedeem = (rewardId: string) => {
    setRedeemingId(rewardId)
    redeemReward(rewardId, {
      onSuccess: () => {
        showSuccess(t('loyalty.rewards.success'))
      },
      onSettled: () => setRedeemingId(null),
    })
  }

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'history', label: t('xuHistory.tab.history') },
    { key: 'rewards', label: t('loyalty.tab.rewards') },
  ]

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('xuHistory.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Balance header */}
        <View
          style={{ backgroundColor: colors.coin }}
          className="items-center px-4 py-6">
          <AppText raw variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {t('xuHistory.subtitle')}
          </AppText>
          {balance !== undefined && (
            <AppText
              raw
              variant="heading1"
              weight="bold"
              style={{ color: '#fff', fontSize: 32, marginTop: 4 }}>
              {balance.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} Xu
            </AppText>
          )}
        </View>

        {/* Tab chips */}
        <View className="flex-row gap-2 px-4 py-3 border-b border-neutrals900">
          {TABS.map((tab) => (
            <Chip
              key={tab.key}
              variant="outline"
              selected={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}>
              {tab.label}
            </Chip>
          ))}
        </View>

        {activeTab === 'history' ? (
          isLoading ? (
            <XuSkeletonList />
          ) : transactions.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <EmptyState icon={Coins} message={t('xuHistory.empty')} />
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
          )
        ) : isLoadingRewards ? (
          <XuSkeletonList />
        ) : rewards.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState icon={Coins} message={t('loyalty.rewards.empty')} />
          </View>
        ) : (
          <FlatList
            data={rewards}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <RewardCard
                reward={item}
                userBalance={balance}
                onRedeem={handleRedeem}
                isRedeeming={redeemingId === item._id}
              />
            )}
            contentContainerStyle={{ paddingVertical: 8 }}
            ListFooterComponent={<View style={{ height: 16 }} />}
          />
        )}
      </SafeAreaView>
    </>
  )
}
