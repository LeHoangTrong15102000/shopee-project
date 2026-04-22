import React from 'react'
import { View, ScrollView, Image, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { AppText, Badge, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'
import { useOrderDetail, useCancelOrder, useConfirmReceived, useReturnOrder } from '@/hooks/useOrders'
import { useDialog } from '@/components/ui/DialogProvider'
import OrderTimeline from '@/components/orders/OrderTimeline'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { ORDER_STATUS, type OrderStatusType } from '@/constants/order'

export default function OrderDetailScreen() {
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
          Không tìm thấy đơn hàng
        </AppText>
      </View>
    )
  }

  const handleCancel = () => {
    showConfirm(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này?',
      () => {
        cancelOrder(order._id, {
          onSuccess: () => router.back(),
        })
      },
      undefined,
      'horizontal'
    )
  }

  const handleConfirmReceived = () => {
    showConfirm(
      'Xác nhận đã nhận hàng',
      'Bạn đã nhận được đơn hàng này?',
      () => {
        confirmReceived(order._id, {
          onSuccess: () => router.back(),
        })
      },
      undefined,
      'horizontal'
    )
  }

  const handleReturn = () => {
    showConfirm(
      'Trả hàng',
      'Bạn có muốn yêu cầu trả hàng?',
      () => {
        returnOrder(order._id, {
          onSuccess: () => router.back(),
        })
      },
      undefined,
      'horizontal'
    )
  }

  // Status mapping: string → display
  const STATUS_MAP: Record<OrderStatusType, { label: string; variant: 'success' | 'error' | 'primary' | 'warning' | 'default' }> = {
    [ORDER_STATUS.PENDING]: { label: 'Chờ xác nhận', variant: 'warning' },
    [ORDER_STATUS.CONFIRMED]: { label: 'Đã xác nhận', variant: 'primary' },
    [ORDER_STATUS.PROCESSING]: { label: 'Đang xử lý', variant: 'default' },
    [ORDER_STATUS.SHIPPING]: { label: 'Đang giao', variant: 'primary' },
    [ORDER_STATUS.DELIVERED]: { label: 'Đã giao', variant: 'success' },
    [ORDER_STATUS.CANCELLED]: { label: 'Đã hủy', variant: 'error' },
    [ORDER_STATUS.RETURNED]: { label: 'Trả hàng', variant: 'default' },
  }
  const statusInfo = STATUS_MAP[order.status as OrderStatusType] ?? { label: `Trạng thái ${order.status}`, variant: 'warning' as const }

  // Compute subtotal from items
  const subtotal = order.items?.reduce((sum, item) => sum + item.price * item.buy_count, 0) ?? 0

  const canCancel = order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.CONFIRMED
  const canConfirmReceived = order.status === ORDER_STATUS.SHIPPING
  const canReturn = order.status === ORDER_STATUS.DELIVERED

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Chi tiết đơn hàng',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Order Status */}
          <View className="border-b border-neutrals900 px-4 py-3">
            <View className="flex-row items-center justify-between">
              <AppText raw variant="bodySmall" color="muted">
                Mã đơn hàng: #{order._id.slice(-8).toUpperCase()}
              </AppText>
              <Badge variant={statusInfo.variant} size="sm">
                {statusInfo.label}
              </Badge>
            </View>
          </View>

          {/* Delivery Address */}
          {order.address && (
            <View className="border-b border-neutrals900 px-4 py-3">
              <AppText raw variant="body" weight="semibold" className="mb-2">
                Địa chỉ giao hàng
              </AppText>
              <AppText raw variant="bodySmall" color="muted">
                {order.address}
              </AppText>
            </View>
          )}

          {/* Products */}
          <View className="border-b border-neutrals900 px-4 py-3">
            <AppText raw variant="body" weight="semibold" className="mb-3">
              Sản phẩm
            </AppText>
            {order.items?.map((item: any) => (
              <View key={item._id} className="mb-3 flex-row items-start gap-3">
                <Image
                  source={{ uri: item.product.image }}
                  style={{ width: 56, height: 56, borderRadius: 8 }}
                  resizeMode="cover"
                />
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
            ))}
          </View>

          {/* Price Breakdown */}
          <View className="border-b border-neutrals900 px-4 py-3">
            <AppText raw variant="body" weight="semibold" className="mb-3">
              Chi tiết thanh toán
            </AppText>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <AppText raw variant="bodySmall" color="muted">
                  Tạm tính
                </AppText>
                <AppText raw variant="bodySmall">
                  {formatPrice(subtotal)}
                </AppText>
              </View>
              <View className="flex-row justify-between border-t border-neutrals900 pt-2">
                <AppText raw variant="body" weight="semibold">
                  Tổng cộng
                </AppText>
                <AppText raw variant="body" weight="bold" color="primary">
                  {formatPrice(order.total_price)}
                </AppText>
              </View>
            </View>
          </View>

          {/* Timeline */}
          <View className="border-b border-neutrals900 py-3">
            <View className="px-4 pb-2">
              <AppText raw variant="body" weight="semibold">
                Trạng thái đơn hàng
              </AppText>
            </View>
            <OrderTimeline
              status={order.status}
              createdAt={order.createdAt}
            />
          </View>

          {/* Action Buttons */}
          <View className="px-4 py-4 gap-2">
            {canCancel && (
              <AppButton
                variant="outline"
                onPress={handleCancel}
                loading={isCancelling}
                className="w-full">
                Hủy đơn hàng
              </AppButton>
            )}
            {canConfirmReceived && (
              <AppButton
                variant="primary"
                onPress={handleConfirmReceived}
                loading={isConfirming}
                className="w-full">
                Đã nhận hàng
              </AppButton>
            )}
            {canReturn && (
              <AppButton
                variant="outline"
                onPress={handleReturn}
                className="w-full">
                Trả hàng
              </AppButton>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
