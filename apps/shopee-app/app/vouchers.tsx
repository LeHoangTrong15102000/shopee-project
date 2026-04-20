import React, { useState } from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Ticket } from 'lucide-react-native'
import { AppText, Chip, EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useAvailableVouchers, useSavedVouchers, useCollectVoucher } from '@/hooks/useVouchers'
import VoucherCard from '@/components/vouchers/VoucherCard'
import VoucherSkeleton from '@/components/vouchers/VoucherSkeleton'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

type TabKey = 'available' | 'saved'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'available', label: 'Voucher có sẵn' },
  { key: 'saved', label: 'Voucher của tôi' },
]

export default function VoucherScreen() {
  const colors = useColors()
  const [activeTab, setActiveTab] = useState<TabKey>('available')
  const [collectingId, setCollectingId] = useState<string | null>(null)

  const { data: availableData, isLoading: isLoadingAvailable } = useAvailableVouchers()
  const { data: savedData, isLoading: isLoadingSaved } = useSavedVouchers()
  const { mutate: collectVoucher } = useCollectVoucher()

  const availableVouchers = (availableData as any)?.data ?? []
  const savedVouchers = (savedData as any)?.data ?? []

  const handleCollect = (id: string) => {
    setCollectingId(id)
    collectVoucher(id, {
      onSettled: () => setCollectingId(null),
    })
  }

  const isLoading = activeTab === 'available' ? isLoadingAvailable : isLoadingSaved
  const vouchers = activeTab === 'available' ? availableVouchers : savedVouchers

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Kho Voucher',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Tab chips */}
        <View
          className="flex-row gap-2 px-4 py-3 border-b border-neutrals900"
          style={{ backgroundColor: colors.background }}>
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

        {isLoading ? (
          <VoucherSkeleton />
        ) : vouchers.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState
              icon={Ticket}
              message={
                activeTab === 'available'
                  ? 'Chưa có voucher nào'
                  : 'Bạn chưa lưu voucher nào'
              }
            />
          </View>
        ) : (
          <FlatList
            data={vouchers}
            keyExtractor={(item: any) => item._id}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }: { item: any }) => (
              <VoucherCard
                voucher={item}
                showActions={activeTab === 'available'}
                onCollect={handleCollect}
                isCollecting={collectingId === item._id}
              />
            )}
            ListFooterComponent={<View style={{ height: 16 }} />}
          />
        )}
      </SafeAreaView>
    </>
  )
}
