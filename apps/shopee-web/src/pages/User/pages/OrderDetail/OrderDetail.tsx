import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { OrderStatus } from 'src/config/orderStatus'
import { ANIMATION_DURATION } from 'src/styles/animations/motion.config'
import CancelOrderModal from './components/CancelOrderModal'
import OrderActionButtons from './components/OrderActionButtons'
import OrderDetailItems from './components/OrderDetailItems'
import OrderSummarySection from './components/OrderSummarySection'
import OrderTimeline from './components/OrderTimeline'
import ReturnOrderModal from './components/ReturnOrderModal'
import SEO from 'src/components/SEO'
import {
  formatDate,
  getStatusDisplay,
  pageContainerVariants,
  paymentMethodLabels,
  reducedMotionVariants,
  sectionVariants,
  statusBadgeVariants
} from './orderDetail.constants'
import { useOrderDetail } from './useOrderDetail'

export default function OrderDetail() {
  const { t } = useTranslation('order')
  const {
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
  } = useOrderDetail()

  const shouldReduceMotion = useReducedMotion()

  if (isLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent' />
      </div>
    )
  }

  if (!order) {
    return (
      <div className='flex min-h-[400px] flex-col items-center justify-center'>
        <p className='text-gray-500 dark:text-gray-300'>{t('detail.notFound')}</p>
        <Link to='/user/purchase' className='mt-4 text-orange hover:underline dark:text-orange-400'>
          {t('detail.backToOrders')}
        </Link>
      </div>
    )
  }

  const status = getStatusDisplay(order.status as OrderStatus)
  const canCancel = ['pending', 'confirmed'].includes(order.status)
  const isDelivered = order.status === 'delivered'
  const deliveredDaysAgo = isDelivered
    ? Math.floor((Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const canReturn = isDelivered && deliveredDaysAgo <= 7
  const isReturnExpired = isDelivered && deliveredDaysAgo > 7

  const containerVariants = shouldReduceMotion ? reducedMotionVariants : pageContainerVariants
  const sectionItemVariants = shouldReduceMotion ? reducedMotionVariants : sectionVariants

  return (
    <motion.div variants={containerVariants} initial='hidden' animate='visible' className='space-y-4'>
      <SEO title={`${t('detail.title')} #${order._id.slice(-8)}`} noindex />
      {/* Header */}
      <motion.div
        variants={sectionItemVariants}
        className='relative overflow-hidden rounded-xl bg-white p-4 shadow-xs transition-all duration-200 hover:shadow-md dark:border dark:border-slate-700 dark:bg-slate-800'
      >
        <div className='absolute top-0 right-0 left-0 h-1 bg-linear-to-r from-orange via-rose-500 to-amber-500' />
        <div className='flex items-center justify-between'>
          <div>
            <motion.button
              onClick={() => navigate(-1)}
              className='mb-2 flex cursor-pointer items-center gap-1.5 text-sm text-gray-500 transition-colors duration-200 hover:text-orange dark:text-gray-400 dark:hover:text-orange-400'
              whileHover={shouldReduceMotion ? {} : { x: -3 }}
              transition={{ duration: ANIMATION_DURATION.fast }}
              aria-label={t('detail.backAria')}
            >
              <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18' />
              </svg>
              {t('detail.back')}
            </motion.button>
            <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100'>{t('detail.title')}</h1>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-300'>
              {t('detail.orderId')} <span className='font-medium'>{order._id.slice(-8).toUpperCase()}</span>
            </p>
          </div>
          <motion.div
            variants={shouldReduceMotion ? reducedMotionVariants : statusBadgeVariants}
            className={`flex items-center gap-2 rounded-full px-4 py-2 ${status.bgColor} border border-current/10`}
          >
            <span className={`font-semibold ${status.color}`}>{status.label}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Order Tracking Timeline + Status Tracker */}
      <OrderTimeline
        tracking={tracking}
        currentStatus={currentStatus}
        isSubscribed={isSubscribed}
        orderStatus={order.status}
        orderTotal={order.total}
        stepTimestamps={stepTimestamps}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* Shipping Address */}
      <motion.div
        variants={sectionItemVariants}
        whileHover={shouldReduceMotion ? {} : { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
        transition={{ duration: ANIMATION_DURATION.fast }}
        className='relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-xs transition-all duration-200 dark:border-slate-700 dark:bg-slate-800'
      >
        <h2 className='mb-4 flex items-center gap-3 font-semibold text-gray-900 dark:text-gray-100'>
          <span className='inline-flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-orange to-rose-500 shadow-md shadow-orange-200/40 dark:shadow-orange-800/30'>
            <svg className='h-3.5 w-3.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
                clipRule='evenodd'
              />
            </svg>
          </span>
          {t('detail.shippingAddress')}
        </h2>
        <div className='ml-12 space-y-1.5 text-sm'>
          <p className='text-base font-semibold text-gray-900 dark:text-gray-100'>{order.shippingAddress.fullName}</p>
          <p className='flex items-center gap-1.5 text-gray-600 dark:text-gray-300'>
            <svg
              className='h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z'
              />
            </svg>
            {order.shippingAddress.phone}
          </p>
          <p className='flex items-start gap-1.5 text-gray-600 dark:text-gray-300'>
            <svg
              className='mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M15 10.5a3 3 0 11-6 0 3 3 0 016 0z' />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'
              />
            </svg>
            {order.shippingAddress.street}, {order.shippingAddress.ward}, {order.shippingAddress.district},{' '}
            {order.shippingAddress.province}
          </p>
        </div>
      </motion.div>

      {/* Order Items */}
      <OrderDetailItems order={order} shouldReduceMotion={shouldReduceMotion} />

      {/* Payment & Shipping Info */}
      <motion.div variants={sectionItemVariants} className='grid gap-4 md:grid-cols-2'>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
          transition={{ duration: ANIMATION_DURATION.fast }}
          className='rounded-xl bg-white p-5 shadow-xs transition-all duration-200 dark:border dark:border-slate-700 dark:bg-slate-800'
        >
          <h2 className='mb-3 flex items-center gap-2.5 font-semibold text-gray-900 dark:text-gray-100'>
            <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-200/40 dark:shadow-violet-800/30'>
              <svg className='h-4 w-4 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z'
                />
              </svg>
            </span>
            {t('detail.payment')}
          </h2>
          <p className='ml-10.5 text-sm text-gray-600 dark:text-gray-300'>
            {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
          </p>
        </motion.div>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
          transition={{ duration: ANIMATION_DURATION.fast }}
          className='rounded-xl bg-white p-5 shadow-xs transition-all duration-200 dark:border dark:border-slate-700 dark:bg-slate-800'
        >
          <h2 className='mb-3 flex items-center gap-2.5 font-semibold text-gray-900 dark:text-gray-100'>
            <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-200/40 dark:shadow-sky-800/30'>
              <svg className='h-4 w-4 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h3.375m0 0V11.25m0 3H12M5.625 11.25H3.375m2.25 0V8.625c0-.621.504-1.125 1.125-1.125h5.25M12 11.25V8.625'
                />
              </svg>
            </span>
            {t('detail.shipping')}
          </h2>
          <div className='ml-10.5'>
            <p className='text-sm text-gray-600 dark:text-gray-300'>{order.shippingMethod.name}</p>
            <p className='mt-1 text-xs text-gray-400 dark:text-slate-400'>{order.shippingMethod.estimatedDays}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Order Summary */}
      <OrderSummarySection order={order} shouldReduceMotion={shouldReduceMotion} />

      {/* Order Info */}
      <motion.div
        variants={sectionItemVariants}
        whileHover={shouldReduceMotion ? {} : { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
        transition={{ duration: ANIMATION_DURATION.fast }}
        className='rounded-xl bg-white p-5 shadow-xs transition-all duration-200 dark:border dark:border-slate-700 dark:bg-slate-800'
      >
        <h2 className='mb-4 flex items-center gap-2.5 font-semibold text-gray-900 dark:text-gray-100'>
          <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200/40 dark:shadow-indigo-800/30'>
            <svg className='h-4 w-4 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z'
              />
            </svg>
          </span>
          {t('detail.orderInfo')}
        </h2>
        <div className='grid gap-4 text-sm md:grid-cols-2'>
          <div className='flex items-center gap-2'>
            <svg
              className='h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={1.5}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5'
              />
            </svg>
            <div>
              <span className='text-gray-500 dark:text-gray-300'>{t('detail.orderDate')}</span>
              <span className='ml-2 font-medium text-gray-900 dark:text-gray-100'>{formatDate(order.createdAt)}</span>
            </div>
          </div>
          {order.note && (
            <div className='flex items-start gap-2'>
              <svg
                className='mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z'
                />
              </svg>
              <div>
                <span className='text-gray-500 dark:text-gray-300'>{t('detail.note')}</span>
                <span className='ml-2 text-gray-900 dark:text-gray-100'>{order.note}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <OrderActionButtons
        canCancel={canCancel}
        canReturn={canReturn}
        isReturnExpired={isReturnExpired}
        shouldReduceMotion={shouldReduceMotion}
        onShowCancelModal={() => setShowCancelModal(true)}
        onShowReturnModal={() => setShowReturnModal(true)}
      />

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelOrderModal
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            onClose={() => setShowCancelModal(false)}
            onConfirm={handleCancelOrder}
            isPending={cancelMutation.isPending}
            shouldReduceMotion={shouldReduceMotion}
          />
        )}
      </AnimatePresence>

      {/* Return Modal */}
      <AnimatePresence>
        {showReturnModal && (
          <ReturnOrderModal
            returnReason={returnReason}
            setReturnReason={(val) => {
              setReturnReason(val)
              if (val.trim()) setReturnReasonError('')
            }}
            returnReasonError={returnReasonError}
            onClose={() => {
              setShowReturnModal(false)
              setReturnReason('')
              setReturnReasonError('')
            }}
            onConfirm={handleReturnOrder}
            isPending={returnMutation.isPending}
            shouldReduceMotion={shouldReduceMotion}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
