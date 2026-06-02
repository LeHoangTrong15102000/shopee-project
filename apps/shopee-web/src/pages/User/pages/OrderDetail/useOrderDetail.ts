import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import orderApi from 'src/apis/order.api'
import orderTrackingApi from 'src/apis/orderTracking.api'
import { orderStatusFromNumber } from 'src/constant/order'
import useOrderTracking from 'src/hooks/useOrderTracking'
import { OrderTracking, TrackingEvent } from 'src/types/orderTracking.type'

export function useOrderDetail() {
  const { t } = useTranslation('order')
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const statusString = statusParam ? orderStatusFromNumber(Number(statusParam)) : undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [returnReasonError, setReturnReasonError] = useState('')

  // WebSocket: Real-time order status tracking
  const { currentStatus, isSubscribed, statusHistory } = useOrderTracking(orderId)

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getOrderById(orderId as string),
    enabled: !!orderId,
  })

  const { data: trackingData } = useQuery({
    queryKey: ['orderTracking', orderId, statusString],
    queryFn: () =>
      orderTrackingApi.getTracking({
        order_id: orderId,
        status: statusString || orderData?.data.data.status,
      }),
    enabled: !!orderId && (!!statusString || !!orderData),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderApi.cancelOrder(id, reason),
    onSuccess: () => {
      toast.success(t('cancel.success'))
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setShowCancelModal(false)
    },
    onError: () => {
      toast.error(t('cancel.error'))
    },
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderApi.returnOrder(id, reason),
    onSuccess: () => {
      toast.success(t('return.success'))
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setShowReturnModal(false)
      setReturnReason('')
      setReturnReasonError('')
    },
    onError: () => {
      toast.error(t('return.error'))
    },
  })

  const order = orderData?.data.data
  const rawTracking = trackingData?.data.data

  // Build fallback tracking when the real tracking API hasn't returned data yet
  const fallbackTracking: OrderTracking | undefined = (() => {
    if (rawTracking || !order) return undefined

    const effectiveStatus = (currentStatus || order.status) as string
    const statusProgression = ['pending', 'confirmed', 'processing', 'shipping', 'delivered']
    const statusDescriptions: Record<string, string> = {
      pending: 'Đơn hàng đã được đặt thành công',
      confirmed: 'Đơn hàng đã được xác nhận',
      processing: 'Đơn hàng đang được đóng gói',
      shipping: 'Đơn hàng đang trên đường giao đến bạn',
      delivered: 'Đơn hàng đã được giao thành công',
    }
    const currentIndex = statusProgression.indexOf(effectiveStatus)
    const baseTime = new Date(order.createdAt).getTime()

    const timeline: TrackingEvent[] = statusProgression
      .slice(0, currentIndex >= 0 ? currentIndex + 1 : 1)
      .map((status, index) => ({
        status,
        description: statusDescriptions[status] ?? status,
        location: 'TP. Hồ Chí Minh',
        timestamp: new Date(baseTime + index * 4 * 60 * 60 * 1000).toISOString(),
      }))

    const addr = order.shippingAddress
    return {
      _id: 'mock-tracking-' + order._id,
      order_id: order._id,
      user_id: order.userId || 'user-1',
      tracking_number:
        'VN' + new Date(order.createdAt).getFullYear() + 'SHOP' + order._id.slice(-4).toUpperCase(),
      carrier: 'ghn',
      status: effectiveStatus as OrderTracking['status'],
      estimated_delivery: new Date(baseTime + 5 * 24 * 60 * 60 * 1000).toISOString(),
      timeline,
      shipping_address: addr
        ? {
            name: addr.fullName,
            phone: addr.phone,
            address: addr.street,
            province: addr.province,
            district: addr.district,
            ward: addr.ward,
          }
        : {
            name: 'Nguyễn Văn A',
            phone: '0901234567',
            address: '123 Đường Lê Lợi',
            province: 'TP. Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Bến Nghé',
          },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }
  })()

  const tracking = rawTracking ?? fallbackTracking

  // Build stepTimestamps from tracking timeline + websocket statusHistory
  const stepTimestamps = (() => {
    const timestamps: Record<string, string> = {}
    if (tracking?.timeline) {
      for (const event of tracking.timeline) {
        timestamps[event.status] = event.timestamp
      }
    }
    for (const entry of statusHistory) {
      timestamps[entry.status] = entry.updated_at
    }
    const effectiveStatus = currentStatus || order?.status
    if (effectiveStatus === 'delivered' && !timestamps['delivered'] && order?.updatedAt) {
      timestamps['delivered'] = order.updatedAt
    }
    return timestamps
  })()

  const handleCancelOrder = () => {
    if (orderId) {
      cancelMutation.mutate({ id: orderId, reason: cancelReason })
    }
  }

  const handleReturnOrder = () => {
    if (!returnReason.trim()) {
      setReturnReasonError(t('return.reasonRequired'))
      return
    }
    if (orderId) {
      setReturnReasonError('')
      returnMutation.mutate({ id: orderId, reason: returnReason })
    }
  }

  return {
    orderId,
    order,
    tracking,
    isLoading,
    navigate,
    currentStatus,
    isSubscribed,
    stepTimestamps,
    showCancelModal,
    setShowCancelModal,
    cancelReason,
    setCancelReason,
    showReturnModal,
    setShowReturnModal,
    returnReason,
    setReturnReason,
    returnReasonError,
    setReturnReasonError,
    cancelMutation,
    returnMutation,
    handleCancelOrder,
    handleReturnOrder,
  }
}
