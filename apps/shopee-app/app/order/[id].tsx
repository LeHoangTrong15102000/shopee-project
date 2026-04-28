import React from 'react'
import { View, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'
import { useOrderDetail, useCancelOrder, useConfirmReceived, useReturnOrder } from '@/hooks/useOrders'
import { useDialog } from '@/components/ui/DialogProvider'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import OrderDetailHeader from '@/components/order-detail/OrderDetailHeader'
import OrderItems from '@/components/order-detail/OrderItems'
import OrderActions from '@/components/order-detail/OrderActions'
import OrderTimeline from '@/components/order-detail/OrderTimeline'

export default function OrderDetailScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { showConfirm } = useDialog()

  const { data, isLoading } = useOrderDetail(id)
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder()
  const { mutate: confirmReceived, isPending: isConfirming } = useConfirmReceived()
  const { mutate: returnOrder } = useReturnOrder()

  const order = data?.data

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center">
        <AppText raw variant="body" color="muted">
          {t('orderDetail.error.notFound')}
        </AppText>
      </View>
    )
  }

  const handleCancel = () => {
    showConfirm(
      t('orderDetail.dialog.cancelTitle'),
      t('orderDetail.dialog.cancelMessage'),
      () => cancelOrder(order._id, { onSuccess: () => router.back() }),
      undefined,
      'horizontal'
    )
  }

  const handleConfirmReceived = () => {
    showConfirm(
      t('orderDetail.dialog.confirmTitle'),
      t('orderDetail.dialog.confirmMessage'),
      () => confirmReceived(order._id, { onSuccess: () => router.back() }),
      undefined,
      'horizontal'
    )
  }

  const handleReturn = () => {
    showConfirm(
      t('orderDetail.dialog.returnTitle'),
      t('orderDetail.dialog.returnMessage'),
      () => returnOrder(order._id, { onSuccess: () => router.back() }),
      undefined,
      'horizontal'
    )
  }

  const subtotal = order.items?.reduce((sum, item) => sum + item.price * item.buy_count, 0) ?? 0

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('orderDetail.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <OrderDetailHeader orderId={order._id} status={order.status} />

          {order.address && (
            <View className="border-b border-neutrals900 px-4 py-3">
              <AppText raw variant="body" weight="semibold" className="mb-2">
                {t('orderDetail.section.shippingAddress')}
              </AppText>
              <AppText raw variant="bodySmall" color="muted">
                {order.address}
              </AppText>
            </View>
          )}

          <OrderItems items={order.items ?? []} />

          <View className="border-b border-neutrals900 px-4 py-3">
            <AppText raw variant="body" weight="semibold" className="mb-3">
              {t('orderDetail.section.payment')}
            </AppText>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <AppText raw variant="bodySmall" color="muted">
                  {t('orderDetail.payment.subtotal')}
                </AppText>
                <AppText raw variant="bodySmall">{formatPrice(subtotal)}</AppText>
              </View>
              <View className="flex-row justify-between border-t border-neutrals900 pt-2">
                <AppText raw variant="body" weight="semibold">
                  {t('orderDetail.payment.total')}
                </AppText>
                <AppText raw variant="body" weight="bold" color="primary">
                  {formatPrice(order.total_price)}
                </AppText>
              </View>
            </View>
          </View>

          <View className="border-b border-neutrals900 py-3">
            <View className="px-4 pb-2">
              <AppText raw variant="body" weight="semibold">
                {t('orderDetail.section.status')}
              </AppText>
            </View>
            <OrderTimeline status={order.status} createdAt={order.createdAt} />
          </View>

          <OrderActions
            status={order.status}
            onCancel={handleCancel}
            onConfirmReceived={handleConfirmReceived}
            onReturn={handleReturn}
            isCancelling={isCancelling}
            isConfirming={isConfirming}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
