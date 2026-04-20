import React, { useState, useCallback } from 'react'
import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import { ShoppingBag } from 'lucide-react-native'
import { AppText, EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useOrders, useCancelOrder, useConfirmReceived, useReturnOrder } from '@/hooks/useOrders'
import { useDialog } from '@/components/ui/DialogProvider'
import { DialogProvider } from '@/components/ui/DialogProvider'
import OrderStatusTabs, { type OrderStatusTab } from '@/components/orders/OrderStatusTabs'
import OrderCard from '@/components/orders/OrderCard'
import OrderSkeleton from '@/components/orders/OrderSkeleton'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

function OrdersContent() {
  const colors = useColors()
  const router = useRouter()
  const params = useLocalSearchParams()
  const { showConfirm } = useDialog()

  const initialStatus = (params.status as OrderStatusTab) ?? 'all'
  const [activeTab, setActiveTab] = useState<OrderStatusTab>(initialStatus)

  const statusMap: Record<string, number> = {
    pending: 1,
    shipping: 2,
    delivered: 3,
    cancelled: -1,
  }
  const statusFilter = activeTab === 'all' ? undefined : statusMap[activeTab]

  const { data, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrders(statusFilter)

  const { mutate: cancelOrder } = useCancelOrder()
  const { mutate: confirmReceived } = useConfirmReceived()
  const { mutate: returnOrder } = useReturnOrder()

  const allOrders = data?.pages.flatMap((p) => p.data.orders) ?? []

  const handleCancel = useCallback(
    (orderId: string) => {
      showConfirm(
        'Hủy đơn hàng',
        'Bạn có chắc chắn muốn hủy đơn hàng này?',
        () => cancelOrder(orderId),
        undefined,
        'horizontal'
      )
    },
    [showConfirm, cancelOrder]
  )

  const handleConfirmReceived = useCallback(
    (orderId: string) => {
      showConfirm(
        'Xác nhận đã nhận hàng',
        'Bạn đã nhận được đơn hàng này?',
        () => confirmReceived(orderId),
        undefined,
        'horizontal'
      )
    },
    [showConfirm, confirmReceived]
  )

  const handleReturn = useCallback(
    (orderId: string) => {
      showConfirm(
        'Trả hàng',
        'Bạn có muốn yêu cầu trả hàng?',
        () => returnOrder(orderId),
        undefined,
        'horizontal'
      )
    },
    [showConfirm, returnOrder]
  )

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <OrderStatusTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {isLoading ? (
        <OrderSkeleton />
      ) : allOrders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <EmptyState icon={ShoppingBag} message="Không có đơn hàng nào" />
        </View>
      ) : (
        <FlatList
          data={allOrders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={(id) => router.push({ pathname: '/order/[id]', params: { id } })}
              onCancel={handleCancel}
              onConfirmReceived={handleConfirmReceived}
              onReturn={handleReturn}
            />
          )}
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
        />
      )}
    </SafeAreaView>
  )
}

export default function OrdersScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Đơn hàng của tôi',
        }}
      />
      <DialogProvider>
        <OrdersContent />
      </DialogProvider>
    </>
  )
}
