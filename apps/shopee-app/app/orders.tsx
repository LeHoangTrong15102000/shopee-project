import React, { useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'
import { useOrders, useCancelOrder, useConfirmReceived, useReturnOrder } from '@/hooks/useOrders'
import { useDialog } from '@/components/ui/DialogProvider'
import OrderStatusTabs, { type OrderStatusTab } from '@/components/orders/OrderStatusTabs'
import OrderList from '@/components/orders/OrderList'
import EmptyOrderState from '@/components/orders/EmptyOrderState'
import OrderSkeleton from '@/components/orders/OrderSkeleton'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { ORDER_STATUS, type OrderStatusType } from '@/constants/order'

export default function OrdersScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const params = useLocalSearchParams()
  const { showConfirm } = useDialog()

  const initialStatus = (params.status as OrderStatusTab) ?? 'all'
  const [activeTab, setActiveTab] = useState<OrderStatusTab>(initialStatus)

  const tabToStatus: Record<string, OrderStatusType | undefined> = {
    pending: ORDER_STATUS.PENDING,
    shipping: ORDER_STATUS.SHIPPING,
    delivered: ORDER_STATUS.DELIVERED,
    cancelled: ORDER_STATUS.CANCELLED,
  }
  const statusFilter: OrderStatusType | undefined =
    activeTab === 'all' ? undefined : tabToStatus[activeTab]

  const { data, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrders(statusFilter)

  const { mutate: cancelOrder } = useCancelOrder()
  const { mutate: confirmReceived } = useConfirmReceived()
  const { mutate: returnOrder } = useReturnOrder()

  const allOrders = data?.pages.flatMap((p) => p.data.orders) ?? []

  const handleCancel = useCallback(
    (orderId: string) => {
      showConfirm(
        t('orders.dialog.cancelTitle'),
        t('orders.dialog.cancelMessage'),
        () => cancelOrder(orderId),
        undefined,
        'horizontal'
      )
    },
    [t, showConfirm, cancelOrder]
  )

  const handleConfirmReceived = useCallback(
    (orderId: string) => {
      showConfirm(
        t('orders.dialog.confirmTitle'),
        t('orders.dialog.confirmMessage'),
        () => confirmReceived(orderId),
        undefined,
        'horizontal'
      )
    },
    [t, showConfirm, confirmReceived]
  )

  const handleReturn = useCallback(
    (orderId: string) => {
      showConfirm(
        t('orders.dialog.returnTitle'),
        t('orders.dialog.returnMessage'),
        () => returnOrder({ orderId, reason: 'other' }), // quick-return from list; full reason selection is on /return-request
        undefined,
        'horizontal'
      )
    },
    [t, showConfirm, returnOrder]
  )

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('orders.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <OrderStatusTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {isLoading ? (
          <OrderSkeleton />
        ) : allOrders.length === 0 ? (
          <EmptyOrderState />
        ) : (
          <OrderList
            orders={allOrders}
            isRefetching={isRefetching}
            isFetchingNextPage={isFetchingNextPage}
            onRefresh={refetch}
            onLoadMore={loadMore}
            onPress={(id) => router.push({ pathname: '/order/[id]', params: { id } })}
            onCancel={handleCancel}
            onConfirmReceived={handleConfirmReceived}
            onReturn={handleReturn}
          />
        )}
      </SafeAreaView>
    </>
  )
}
