import React from 'react'
import { View, ScrollView, Image, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { AppText, Badge, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'
import { useOrderDetail, useCancelOrder, useConfirmReceived } from '@/hooks/useOrders'
import { useDialog } from '@/components/ui/DialogProvider'
import { DialogProvider } from '@/components/ui/DialogProvider'
import OrderTimeline from '@/components/orders/OrderTimeline'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

function OrderDetailContent() {
  const colors = useColors()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { showConfirm } = useDialog()

  const { data, isLoading } = useOrderDetail(id)
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder()
  const { mutate: confirmReceived, isPending: isConfirming } = useConfirmReceived()

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

  // Status mapping: number → display
  const STATUS_MAP: Record<number, { label: string; variant: 'success' | 'error' | 'primary' | 'warning' }> = {
    1: { label: 'Chờ xác nhận', variant: 'warning' },
    2: { label: 'Đang giao', variant: 'primary' },
    3: { label: 'Đã giao', variant: 'success' },
    [-1]: { label: 'Đã hủy', variant: 'error' },
  }
  const statusInfo = STATUS_MAP[order.status] ?? { label: `Trạng thái ${order.status}`, variant: 'warning' as const }

  // Compute subtotal from items
  const subtotal = order.items?.reduce((sum, item) => sum + item.price * item.buy_count, 0) ?? 0

  return (
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
            status={order.status === 1 ? 'pending' : order.status === 2 ? 'shipping' : order.status === 3 ? 'delivered' : 'cancelled'}
            createdAt={order.createdAt}
          />
        </View>

        {/* Action Buttons */}
        <View className="px-4 py-4">
          {order.status === 1 && (
            <AppButton
              variant="outline"
              onPress={handleCancel}
              loading={isCancelling}
              className="w-full">
              Hủy đơn hàng
            </AppButton>
          )}
          {order.status === 2 && (
            <AppButton
              variant="primary"
              onPress={handleConfirmReceived}
              loading={isConfirming}
              className="w-full">
              Đã nhận hàng
            </AppButton>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default function OrderDetailScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Chi tiết đơn hàng',
        }}
      />
      <DialogProvider>
        <OrderDetailContent />
      </DialogProvider>
    </>
  )
}
