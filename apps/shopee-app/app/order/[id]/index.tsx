import React from 'react'
import { View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'
import { useOrderDetail, useCancelOrder, useConfirmReceived } from '@/hooks/useOrders'
import { useDialog } from '@/components/ui/DialogProvider'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import OrderDetailHeader from '@/components/order-detail/OrderDetailHeader'
import OrderTimeline from '@/components/orders/OrderTimeline'
import OrderActions from '@/components/order-detail/OrderActions'
import { ORDER_STATUS } from '@/constants/order'
import { useReorder } from '@/hooks/useReorder'

export default function OrderDetailScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { showConfirm } = useDialog()

  const { data, isLoading } = useOrderDetail(id)
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder()
  const { mutate: confirmReceived, isPending: isConfirming } = useConfirmReceived()
  const { mutate: reorder, isPending: isReordering } = useReorder()

  const order = data?.data

  const isDelivered = order?.status === ORDER_STATUS.DELIVERED

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
    router.push({ pathname: '/return-request', params: { orderId: order._id } })
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

          <View className="border-b border-neutrals900 px-4 py-3">
            <AppText raw variant="body" weight="semibold" className="mb-3">
              {t('orderDetail.section.products')}
            </AppText>
            {(order.items ?? []).map((item) => (
              <View key={item.product._id} className="mb-3">
                <View className="flex-row items-start gap-3">
                  <View className="flex-1">
                    <AppText raw variant="bodySmall" numberOfLines={2}>
                      {item.product.name}
                    </AppText>
                    <View className="mt-1 flex-row items-center justify-between">
                      <AppText raw variant="labelSmall" color="muted">
                        x{item.buy_count}
                      </AppText>
                      <AppText raw variant="bodySmall" weight="semibold" color="primary">
                        {formatPrice(item.price * item.buy_count)}
                      </AppText>
                    </View>
                  </View>
                </View>
                {isDelivered && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/write-review',
                        params: {
                          productId: item.product._id,
                          orderId: order._id,
                          productName: item.product.name,
                        },
                      })
                    }
                    className="mt-2 self-end rounded-lg border border-neutrals700 px-3 py-1.5"
                    accessibilityRole="button">
                    <AppText raw variant="bodySmall" color="primary">
                      {t('orderDetail.actions.review')}
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

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

          {order.status === ORDER_STATUS.SHIPPING && (
            <View className="px-4 pb-4">
              <AppButton
                variant="primary"
                onPress={() => router.push(`/order/${order._id}/tracking`)}
                className="w-full">
                {t('orderDetail.actions.trackOrder')}
              </AppButton>
            </View>
          )}

          {isDelivered && (
            <View className="gap-2 px-4 pb-4">
              <AppButton
                variant="primary"
                onPress={() => reorder(order._id)}
                loading={isReordering}
                className="w-full">
                {t('orderDetail.actions.reorder')}
              </AppButton>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
