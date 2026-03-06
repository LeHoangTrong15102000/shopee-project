import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import classNames from 'classnames'
import orderApi from 'src/apis/order.api'
import { OrderStatus, Order } from 'src/types/checkout.type'
import OrderCard from 'src/components/OrderCard'
import LiveOrderTracker from 'src/components/LiveOrderTracker'
import Button from 'src/components/Button'
import { useOrderStatus } from 'src/hooks/nuqs/orderSearchParams'
import { ordersStatus, orderStatusFromNumber, orderStatusToNumber } from 'src/constant/order'
import { useIsMobile } from 'src/hooks/useIsMobile'
import SEO from 'src/components/SEO'
import { useTranslation } from 'react-i18next'

const orderTabKeys = [
  'tabs.all',
  'tabs.pending',
  'tabs.confirmed',
  'tabs.shipping',
  'tabs.delivered',
  'tabs.cancelled',
  'tabs.returned'
] as const

const orderTabStatuses = [
  ordersStatus.all,
  ordersStatus.pending,
  ordersStatus.confirmed,
  ordersStatus.shipping,
  ordersStatus.delivered,
  ordersStatus.cancelled,
  ordersStatus.returned
]

export default function OrderList() {
  const { t } = useTranslation('order')
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useOrderStatus() // nuqs: syncs numeric status with URL query param ?status=0,1,2,...
  const [page, setPage] = useState(1)
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set())
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const isMobile = useIsMobile()

  const toggleOrderTracking = (orderId: string) => {
    setExpandedOrderIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  // Check if order can be tracked (pending, confirmed, or shipping)
  const isTrackableOrder = (status: OrderStatus) => {
    return ['pending', 'confirmed', 'shipping'].includes(status)
  }

  // Convert numeric tab to string status for API call
  const activeStatusString = orderStatusFromNumber(activeTab)

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', { status: activeTab, page }],
    queryFn: () =>
      orderApi.getOrders({
        status: activeTab === ordersStatus.all ? undefined : activeStatusString,
        page,
        limit: 10
      })
  })

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => orderApi.cancelOrder(orderId, reason),
    onSuccess: () => {
      toast.success(t('cancel.success'))
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      handleCloseModal()
    },
    onError: () => {
      toast.error(t('cancel.error'))
    }
  })

  const orders = ordersData?.data.data.orders || []
  const pagination = ordersData?.data.data.pagination

  const handleCancelOrder = (orderId: string) => {
    setCancelOrderId(orderId)
    setShowCancelModal(true)
  }

  const handleConfirmCancel = () => {
    if (cancelOrderId) {
      cancelMutation.mutate({ orderId: cancelOrderId, reason: cancelReason })
    }
  }

  const handleCloseModal = () => {
    setShowCancelModal(false)
    setCancelOrderId(null)
    setCancelReason('')
  }

  const handleReorder = (_order: Order) => {
    toast.info(t('reorder.developing'))
  }

  const handleTabChange = (status: number) => {
    setActiveTab(status)
    setPage(1)
  }

  return (
    <div className='space-y-4'>
      <SEO title='Đơn hàng' noindex />
      {/* Tabs */}
      <div className='sticky top-0 z-20 scrollbar-hide flex items-center overflow-x-auto rounded-t-sm bg-white shadow-xs dark:bg-slate-800'>
        {orderTabStatuses.map((status, index) => (
          <Button
            key={status}
            variant='text'
            animated={false}
            onClick={() => handleTabChange(status)}
            className={classNames(
              'flex min-w-18 flex-1 items-center justify-center rounded-none px-2 py-3 text-center text-xs whitespace-nowrap hover:text-orange sm:min-w-0 sm:px-3 sm:py-4 sm:text-sm dark:hover:text-orange-400',
              {
                'border-b-2 border-b-orange font-medium text-orange dark:border-b-orange-400 dark:text-orange-400':
                  activeTab === status,
                'border-b-2 border-b-gray-200 text-gray-900 dark:border-b-slate-600 dark:text-gray-100':
                  activeTab !== status
              }
            )}
          >
            {t(orderTabKeys[index])}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      <div className='space-y-4'>
        {isLoading ? (
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='animate-pulse rounded-xl border border-gray-100 bg-linear-to-br from-white to-gray-50 p-4 shadow-md dark:border-slate-600 dark:from-slate-800 dark:to-slate-900'
              >
                <div className='flex items-center justify-between border-b pb-3 dark:border-slate-600'>
                  <div className='h-4 w-32 rounded-sm bg-gray-200 dark:bg-slate-600' />
                  <div className='h-6 w-24 rounded-full bg-gray-200 dark:bg-slate-600' />
                </div>
                <div className='mt-4 flex gap-4'>
                  <div className='h-16 w-16 rounded-sm bg-gray-200 dark:bg-slate-600' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 w-3/4 rounded-sm bg-gray-200 dark:bg-slate-600' />
                    <div className='h-3 w-1/4 rounded-sm bg-gray-200 dark:bg-slate-600' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={isMobile ? undefined : { opacity: 1, y: 0 }}
            className='flex flex-col items-center justify-center rounded-xl border border-orange-100/30 bg-linear-to-br from-white via-orange-50/20 to-amber-50/20 py-16 shadow-md dark:border-slate-600 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800'
          >
            <div className='text-6xl'>📦</div>
            <p className='mt-4 text-gray-500 dark:text-gray-400'>{t('empty')}</p>
          </motion.div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onCancel={handleCancelOrder}
                onReorder={handleReorder}
                isTrackable={isTrackableOrder(order.status)}
                isTrackingExpanded={expandedOrderIds.has(order._id)}
                onToggleTracking={toggleOrderTracking}
                trackingContent={
                  <LiveOrderTracker
                    orderId={order._id}
                    initialStatus={orderStatusToNumber(order.status) || 1}
                    className='bg-gray-50 dark:bg-slate-900'
                  />
                }
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className='flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-linear-to-r from-white via-gray-50 to-white p-4 shadow-md dark:border-slate-600 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800'>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className='rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-orange hover:bg-orange hover:text-white disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:disabled:hover:border-slate-600 dark:disabled:hover:bg-slate-800 dark:disabled:hover:text-gray-300'
          >
            Trước
          </button>
          <span className='px-4 text-sm text-gray-600 dark:text-gray-400'>
            {t('pagination.page', { page, total: pagination.totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className='rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-orange hover:bg-orange hover:text-white disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:disabled:hover:border-slate-600 dark:disabled:hover:bg-slate-800 dark:disabled:hover:text-gray-300'
          >
            {t('pagination.next')}
          </button>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-xs'
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className='relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-700 dark:bg-slate-800'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleCloseModal}
                className='absolute top-4 right-4 cursor-pointer rounded-full p-1 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-gray-300'
                aria-label={t('cancel.closeModal')}
              >
                <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
              <div className='mb-4'>
                <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>{t('cancel.title')}</h3>
                <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>{t('cancel.irreversible')}</p>
              </div>
              <p className='mb-4 text-sm text-gray-600 dark:text-gray-300'>{t('cancel.confirm')}</p>

              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('cancel.reasonPlaceholder')}
                className='w-full resize-none rounded-xl border border-gray-200 p-3 text-sm transition-all duration-200 focus:border-orange focus:ring-2 focus:ring-orange/20 focus:outline-hidden dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-400'
                rows={3}
              />

              <div className='mt-5 flex justify-end gap-3'>
                <Button
                  variant='secondary'
                  animated={false}
                  onClick={handleCloseModal}
                  className='cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium'
                >
                  {t('cancel.back')}
                </Button>
                <Button
                  variant='danger'
                  animated={false}
                  onClick={handleConfirmCancel}
                  disabled={cancelMutation.isPending}
                  className='cursor-pointer rounded-xl bg-linear-to-r from-red-500 to-rose-600 px-5 py-2.5 text-sm font-medium hover:from-red-600 hover:to-rose-700 hover:shadow-lg hover:shadow-red-200/50 dark:hover:shadow-red-900/30'
                >
                  {cancelMutation.isPending ? t('cancel.processing') : t('cancel.confirmButton')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
