import { memo } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Order } from 'src/types/checkout.type'
import { ORDER_STATUS_CONFIG, OrderStatus, getStatusLabel } from 'src/config/orderStatus'
import { formatCurrency } from 'src/utils/utils'
import { orderStatusToNumber } from 'src/constant/order'
import ImageWithFallback from 'src/components/ImageWithFallback'
import Button from 'src/components/Button'

interface OrderCardProps {
  order: Order
  onCancel?: (orderId: string) => void
  onReorder?: (order: Order) => void
  isTrackable?: boolean
  isTrackingExpanded?: boolean
  onToggleTracking?: (orderId: string) => void
  trackingContent?: React.ReactNode
}

function getStatusDisplay(status: OrderStatus) {
  const config = ORDER_STATUS_CONFIG[status]
  if (!config) {
    return {
      label: status,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-50 dark:bg-gray-900/30',
      borderColor: 'border-gray-200 dark:border-gray-700/50',
      icon: '?',
      animate: false
    }
  }
  return {
    label: getStatusLabel(status),
    color: `${config.color.light} dark:${config.color.dark}`,
    bgColor: `${config.bgColor.light} dark:${config.bgColor.dark}`,
    borderColor: `${config.borderColor.light} dark:${config.borderColor.dark}`,
    icon: config.icon,
    animate: config.animate ?? false
  }
}

const OrderCard = memo(function OrderCard({
  order,
  onCancel,
  onReorder,
  isTrackable,
  isTrackingExpanded,
  onToggleTracking,
  trackingContent
}: OrderCardProps) {
  const status = getStatusDisplay(order.status as OrderStatus)
  const canCancel = ['pending', 'confirmed'].includes(order.status)
  const canReorder = ['delivered', 'cancelled'].includes(order.status)

  const handleCancel = () => {
    if (onCancel) {
      onCancel(order._id)
    }
  }

  const handleReorder = () => {
    if (onReorder) {
      onReorder(order)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='group overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-md transition-all duration-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800'
    >
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-100 bg-linear-to-r from-gray-50/80 via-white to-gray-50/80 px-4 py-3 dark:border-slate-700 dark:from-slate-800/80 dark:via-slate-800 dark:to-slate-800/80'>
        <div className='flex items-center gap-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 dark:bg-orange-900/30'>
            <svg
              className='h-4 w-4 text-orange dark:text-orange-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </div>
          <div>
            <span className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
              {order._id.slice(-8).toUpperCase()}
            </span>
            <p className='text-xs text-gray-400 dark:text-gray-500'>{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${status.color} ${status.bgColor} ${status.borderColor}`}
        >
          {status.label}
        </span>
      </div>

      {/* Items */}
      <div className='p-4'>
        <div className='space-y-3'>
          {order.items.slice(0, 2).map((item, index) => (
            <div
              key={index}
              className='flex gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-700/40'
            >
              <div className='h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-xs dark:border-slate-600'>
                <ImageWithFallback
                  src={item.product?.image || ''}
                  alt={item.product?.name || 'Product'}
                  className='h-full w-full object-cover'
                />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {item.product?.name || 'Sản phẩm'}
                </p>
                <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>x{item.buyCount}</p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-semibold text-orange'>₫{formatCurrency(item.price * item.buyCount)}</p>
              </div>
            </div>
          ))}

          {order.items.length > 2 && (
            <p className='py-1 text-center text-xs text-gray-400 dark:text-gray-500'>
              và {order.items.length - 2} sản phẩm khác
            </p>
          )}
        </div>

        <div className='my-3 border-t border-dashed border-gray-200 dark:border-slate-700' />

        {/* Footer */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500'>
            <svg className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
              />
            </svg>
            <span>{order.items.length} sản phẩm</span>
          </div>
          <div className='text-right'>
            <span className='text-xs text-gray-400 dark:text-gray-500'>Tổng: </span>
            <span className='text-lg font-bold text-orange'>₫{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className='mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-slate-700'>
          <div className='flex items-center gap-2'>
            {isTrackable && onToggleTracking && (
              <Button
                animated={false}
                type='button'
                onClick={() => onToggleTracking(order._id)}
                className='inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:border-slate-500 dark:hover:bg-slate-700'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  className='h-3.5 w-3.5 text-orange dark:text-orange-400'
                >
                  <path d='M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 116 0h3a.75.75 0 00.75-.75V15z' />
                  <path d='M8.25 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM15.75 6.75a.75.75 0 00-.75.75v7.5h7.5v-1.5a3 3 0 00-3-3h-.375V7.5a.75.75 0 00-.75-.75h-2.625z' />
                  <path d='M21.75 18h.75a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75h-.75v3zM19.5 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z' />
                </svg>
                <span>Theo dõi</span>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2.5}
                  stroke='currentColor'
                  className={`h-3 w-3 transition-transform duration-200 ${isTrackingExpanded ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
                </svg>
              </Button>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Link
              to={`/user/order/${order._id}?status=${orderStatusToNumber(order.status)}`}
              className='text-xs font-medium text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
            >
              Chi tiết →
            </Link>
            {canCancel && (
              <Button
                onClick={handleCancel}
                className='rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-800/50 dark:bg-slate-700 dark:text-red-400 dark:hover:bg-red-900/20'
              >
                Hủy đơn
              </Button>
            )}
            {canReorder && (
              <Button
                onClick={handleReorder}
                className='rounded-lg bg-linear-to-r from-orange to-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-all hover:shadow-md'
              >
                Mua lại
              </Button>
            )}
          </div>
        </div>

        {/* Integrated Tracking Section */}
        <AnimatePresence>
          {isTrackingExpanded && trackingContent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className='overflow-hidden'
            >
              <div className='mt-3 border-t border-gray-100 pt-3 dark:border-slate-700'>{trackingContent}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
})

export default OrderCard
