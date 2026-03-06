import { useQuery } from '@tanstack/react-query'
import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import orderTrackingApi from 'src/apis/orderTracking.api'
import OrderTimeline from 'src/components/OrderTimeline'
import { orderStatusFromNumber } from 'src/constant/order'
import { purchasesStatus } from 'src/constant/purchase'
import useOrderTracking from 'src/hooks/useOrderTracking'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { ANIMATION_DURATION, STAGGER_DELAY } from 'src/styles/animations'

interface LiveOrderTrackerProps {
  orderId: string
  initialStatus: number
  className?: string
  trackingNumber?: string
  carrier?: string
}

// Map from socket status strings to purchasesStatus numbers
const STATUS_MAP: Record<string, number> = {
  pending: purchasesStatus.waitForConfirmation,
  confirmed: purchasesStatus.waitForGetting,
  processing: purchasesStatus.waitForGetting,
  shipping: purchasesStatus.inProgress,
  delivered: purchasesStatus.delivered,
  cancelled: purchasesStatus.cancelled,
  returned: purchasesStatus.cancelled
}

// Status labels keys for toast notifications
const STATUS_LABEL_KEYS: Record<number, string> = {
  [purchasesStatus.waitForConfirmation]: 'status.waitForConfirmation',
  [purchasesStatus.waitForGetting]: 'status.waitForGetting',
  [purchasesStatus.inProgress]: 'status.inProgress',
  [purchasesStatus.delivered]: 'status.delivered',
  [purchasesStatus.cancelled]: 'status.cancelled'
}

// Container animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: STAGGER_DELAY.normal, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATION.normal } }
}

export default function LiveOrderTracker({
  orderId,
  initialStatus,
  className,
  trackingNumber = 'VN2024SHOP001',
  carrier = 'Giao Hàng Nhanh'
}: LiveOrderTrackerProps) {
  const { t } = useTranslation('order')
  const reducedMotion = useReducedMotion()
  const [currentStatus, setCurrentStatus] = useState(initialStatus)

  // Use the existing order tracking hook for real-time updates
  const { currentStatus: socketStatus, lastUpdate, isSubscribed, statusHistory } = useOrderTracking(orderId)

  // Convert numeric initialStatus to string status for API call
  const statusString = orderStatusFromNumber(initialStatus) || 'pending'

  // Fetch initial tracking data from API
  const { data: trackingData } = useQuery({
    queryKey: ['orderTracking', orderId, statusString],
    queryFn: () => orderTrackingApi.getTracking({ order_id: orderId, status: statusString }),
    enabled: !!orderId
  })

  // Build timestamps from tracking API timeline + websocket statusHistory
  const timestamps = useMemo(() => {
    const result: Record<number, string> = {}
    // From tracking API timeline
    const timeline = trackingData?.data?.data?.timeline
    if (timeline) {
      for (const event of timeline) {
        const mappedStatus = STATUS_MAP[event.status]
        if (mappedStatus !== undefined) {
          result[mappedStatus] = event.timestamp
        }
      }
    }
    // Override/add from real-time websocket statusHistory
    for (const entry of statusHistory) {
      const mappedStatus = STATUS_MAP[entry.status]
      if (mappedStatus !== undefined) {
        result[mappedStatus] = entry.updated_at
      }
    }
    return result
  }, [trackingData?.data?.data?.timeline, statusHistory])

  // Handle real-time status updates from socket (for currentStatus and toast notifications)
  useEffect(() => {
    if (socketStatus) {
      const mappedStatus = STATUS_MAP[socketStatus]
      if (mappedStatus !== undefined && mappedStatus !== currentStatus) {
        setCurrentStatus(mappedStatus)

        // Show toast notification for status change
        const statusLabelKey = STATUS_LABEL_KEYS[mappedStatus] || 'status.update'
        const statusLabel = t(statusLabelKey as never)
        if (mappedStatus === purchasesStatus.delivered) {
          toast.success(t('toast.orderDelivered', { status: statusLabel }), { autoClose: 5000 })
        } else if (mappedStatus === purchasesStatus.cancelled) {
          toast.warning(t('toast.orderCancelled', { status: statusLabel }), { autoClose: 5000 })
        } else {
          toast.info(t('toast.orderUpdate', { status: statusLabel }), { autoClose: 4000 })
        }
      }
    }
  }, [socketStatus, currentStatus, t])

  // Calculate estimated delivery time (mock: 2-3 days from now for in-progress orders)
  const getEstimatedDelivery = useCallback(() => {
    if (currentStatus === purchasesStatus.inProgress) {
      const now = new Date()
      const minDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      const maxDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      return `${minDate.toLocaleDateString('vi-VN')} - ${maxDate.toLocaleDateString('vi-VN')}`
    }
    return null
  }, [currentStatus])

  const estimatedDelivery = getEstimatedDelivery()
  const isDelivered = currentStatus === purchasesStatus.delivered
  const isCancelled = currentStatus === purchasesStatus.cancelled

  return (
    <motion.div
      className={classNames(
        'overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-800',
        className
      )}
      variants={reducedMotion ? undefined : containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header with gradient */}
      <motion.div
        className={classNames(
          'relative px-4 py-4 md:px-6',
          isCancelled ? 'bg-linear-to-r from-red-500 to-rose-500' : 'bg-linear-to-r from-[#ee4d2d] to-[#ff6b4a]'
        )}
        variants={reducedMotion ? undefined : itemVariants}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {/* Tracking Icon */}
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs'>
              <svg
                className={classNames('h-5 w-5', isCancelled ? 'text-red-500' : 'text-[#ee4d2d]')}
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
                />
              </svg>
            </div>
            <div>
              <h4 className='font-semibold text-white'>{t('tracking.title')}</h4>
              <p className='text-xs text-white/80'>
                {t('tracking.trackingNumber')}: {trackingNumber}
              </p>
            </div>
          </div>

          {/* Live Badge */}
          {isSubscribed && !isDelivered && !isCancelled && (
            <motion.div
              className='flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-xs'
              initial={reducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
              animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: ANIMATION_DURATION.normal }}
            >
              <span className='relative flex h-2 w-2'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75' />
                <span className='relative inline-flex h-2 w-2 rounded-full bg-white' />
              </span>
              <span className='text-xs font-medium text-white'>{t('tracking.live')}</span>
            </motion.div>
          )}

          {/* Delivered Badge */}
          {isDelivered && (
            <div className='flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-xs'>
              <svg className='h-4 w-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-xs font-medium text-white'>{t('tracking.completed')}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <div className='p-4 md:p-6'>
        {/* Carrier Info */}
        <motion.div
          className='mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-slate-700'
          variants={reducedMotion ? undefined : itemVariants}
        >
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-xs dark:bg-slate-600'>
            <svg
              className='h-5 w-5 text-[#ee4d2d]'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h3.375m0 0V11.25m0 3H12M5.625 11.25H3.375m2.25 0V8.625c0-.621.504-1.125 1.125-1.125h5.25M12 11.25V8.625'
              />
            </svg>
          </div>
          <div className='flex-1'>
            <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>{carrier}</p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>{t('tracking.carrier')}</p>
          </div>
          <div className='text-right'>
            <p className='text-sm font-medium text-[#ee4d2d]'>{trackingNumber}</p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>{t('tracking.trackingNumber')}</p>
          </div>
        </motion.div>

        {/* Estimated delivery time for in-progress orders */}
        <AnimatePresence>
          {estimatedDelivery && (
            <motion.div
              className='mb-4 overflow-hidden rounded-lg border border-orange-200 bg-linear-to-r from-orange-50 to-amber-50'
              initial={reducedMotion ? undefined : { opacity: 0, height: 0 }}
              animate={reducedMotion ? undefined : { opacity: 1, height: 'auto' }}
              exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: ANIMATION_DURATION.normal }}
            >
              <div className='flex items-center gap-3 p-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100'>
                  <svg
                    className='h-5 w-5 text-[#ee4d2d]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
                    />
                  </svg>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>{t('tracking.estimatedDelivery')}</p>
                  <p className='text-base font-semibold text-[#ee4d2d]'>{estimatedDelivery}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Timeline */}
        <motion.div variants={reducedMotion ? undefined : itemVariants}>
          <OrderTimeline orderId={orderId} currentStatus={currentStatus} timestamps={timestamps} />
        </motion.div>

        {/* Last update info */}
        {lastUpdate && (
          <motion.div
            className='mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-slate-700'
            variants={reducedMotion ? undefined : itemVariants}
          >
            <svg
              className='h-4 w-4 text-gray-400 dark:text-gray-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            <p className='text-xs text-gray-400 dark:text-gray-500'>
              {t('tracking.lastUpdate')}:{' '}
              {new Date(lastUpdate).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
