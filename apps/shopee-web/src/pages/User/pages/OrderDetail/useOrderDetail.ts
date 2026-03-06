import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'react-toastify'
import orderApi from 'src/apis/order.api'
import orderTrackingApi from 'src/apis/orderTracking.api'
import { orderStatusFromNumber } from 'src/constant/order'
import useOrderTracking from 'src/hooks/useOrderTracking'

export function useOrderDetail() {
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
    enabled: !!orderId
  })

  const { data: trackingData } = useQuery({
    queryKey: ['orderTracking', orderId, statusString],
    queryFn: () =>
      orderTrackingApi.getTracking({ order_id: orderId, status: statusString || orderData?.data.data.status }),
    enabled: !!orderId && (!!statusString || !!orderData)
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => orderApi.cancelOrder(id, reason),
    onSuccess: () => {
      toast.success('Hủy đơn hàng thành công')
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setShowCancelModal(false)
    },
    onError: () => {
      toast.error('Hủy đơn hàng thất bại')
    }
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => orderApi.returnOrder(id, reason),
    onSuccess: () => {
      toast.success('Yêu cầu trả hàng thành công')
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setShowReturnModal(false)
      setReturnReason('')
      setReturnReasonError('')
    },
    onError: () => {
      toast.error('Yêu cầu trả hàng thất bại')
    }
  })

  const order = orderData?.data.data
  const tracking = trackingData?.data.data

  // Build stepTimestamps from tracking timeline + websocket statusHistory
  const stepTimestamps = useMemo(() => {
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
  }, [tracking?.timeline, statusHistory, currentStatus, order?.status, order?.updatedAt])

  const handleCancelOrder = () => {
    if (orderId) {
      cancelMutation.mutate({ id: orderId, reason: cancelReason })
    }
  }

  const handleReturnOrder = () => {
    if (!returnReason.trim()) {
      setReturnReasonError('Vui lòng nhập lý do trả hàng')
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
    handleReturnOrder
  }
}
