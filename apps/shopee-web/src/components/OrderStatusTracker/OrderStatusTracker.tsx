import classNames from 'classnames'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency } from 'src/utils/utils'

interface OrderStatusTrackerProps {
  currentStatus: string | null
  isSubscribed: boolean
  className?: string
  orderTotal?: number
  stepTimestamps?: Record<string, string>
}

const StepIcon = ({ type, className, isActive }: { type: string; className?: string; isActive?: boolean }) => {
  const sw = isActive ? 2 : 1.5
  const icons: Record<string, React.ReactNode> = {
    pending: (
      // Clipboard/order icon - Đơn Hàng Đã Đặt
      <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={sw}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z'
        />
      </svg>
    ),
    confirmed: (
      // Wallet/payment icon - Đã Xác Nhận Thông Tin Thanh Toán
      <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={sw}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z'
        />
      </svg>
    ),
    processing: (
      // Truck icon - Vận Chuyển
      <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={sw}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
        />
      </svg>
    ),
    shipping: (
      // Package/box icon - Chờ Giao Hàng
      <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={sw}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'
        />
      </svg>
    ),
    delivered: (
      // Star icon - Đánh Giá
      <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={sw}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z'
        />
      </svg>
    )
  }
  return <>{icons[type] || null}</>
}

const ORDER_STEPS = [
  { key: 'pending', label: 'Đơn Hàng Đã Đặt' },
  { key: 'confirmed', label: 'Đã Xác Nhận Thông Tin Thanh Toán' },
  { key: 'processing', label: 'Vận Chuyển' },
  { key: 'shipping', label: 'Chờ Giao Hàng' },
  { key: 'delivered', label: 'Đánh Giá' }
]

const formatLastUpdate = (lastUpdate: string | null): string => {
  if (!lastUpdate) return ''
  const date = new Date(lastUpdate)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${hours}:${minutes} ${day}-${month}-${year}`
}

export default function OrderStatusTracker({
  currentStatus,
  isSubscribed,
  className,
  orderTotal,
  stepTimestamps
}: OrderStatusTrackerProps) {
  const isCancelled = currentStatus === 'cancelled'
  const isReturned = currentStatus === 'returned'
  const isSpecialStatus = isCancelled || isReturned

  const currentStepIndex = useMemo(() => {
    if (!currentStatus || isSpecialStatus) return -1
    return ORDER_STEPS.findIndex((step) => step.key === currentStatus)
  }, [currentStatus, isSpecialStatus])

  return (
    <div
      className={classNames(
        'relative overflow-hidden rounded-2xl border border-gray-100/50 bg-white p-4 shadow-lg md:p-6 dark:border-slate-700 dark:bg-slate-800',
        className
      )}
    >
      {/* Live tracking indicator - Enhanced */}
      {isSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-4 flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-green-50 to-emerald-50 px-4 py-2.5 ring-1 ring-green-200/50 dark:from-green-900/30 dark:to-emerald-900/30 dark:ring-green-700/50'
          aria-label='Đang theo dõi trạng thái đơn hàng trực tiếp'
        >
          <span className='relative flex h-2.5 w-2.5'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75'></span>
            <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-linear-to-r from-green-500 to-emerald-500'></span>
          </span>
          <span className='text-sm font-medium text-green-700 dark:text-green-400'>Đang theo dõi trực tiếp</span>
          <svg className='h-4 w-4 text-green-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
          </svg>
        </motion.div>
      )}

      {/* Special status display - Enhanced */}
      {isSpecialStatus && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={classNames(
            'mb-4 flex items-center justify-center gap-3 rounded-xl px-6 py-4',
            isCancelled
              ? 'bg-linear-to-r from-red-50 to-rose-50 ring-1 ring-red-200/50 dark:from-red-900/30 dark:to-rose-900/30 dark:ring-red-700/50'
              : 'bg-linear-to-r from-amber-50 to-orange-50 ring-1 ring-amber-200/50 dark:from-amber-900/30 dark:to-orange-900/30 dark:ring-amber-700/50'
          )}
        >
          <div
            className={classNames(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isCancelled ? 'bg-red-100 dark:bg-red-900/50' : 'bg-amber-100 dark:bg-amber-900/50'
            )}
          >
            {isCancelled ? (
              <svg
                className='h-5 w-5 text-red-600 dark:text-red-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
              </svg>
            ) : (
              <svg
                className='h-5 w-5 text-amber-600 dark:text-amber-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3' />
              </svg>
            )}
          </div>
          <div>
            <p
              className={classNames(
                'text-base font-semibold',
                isCancelled ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
              )}
            >
              {isCancelled ? 'Đơn hàng đã bị hủy' : 'Đơn hàng đã được trả lại'}
            </p>
            <p
              className={classNames(
                'text-sm',
                isCancelled ? 'text-red-500 dark:text-red-400/80' : 'text-amber-500 dark:text-amber-400/80'
              )}
            >
              {isCancelled ? 'Liên hệ hỗ trợ nếu cần giúp đỡ' : 'Hoàn tiền sẽ được xử lý trong 3-5 ngày'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Step progress bar - Enhanced */}
      {!isSpecialStatus && (
        <div className='relative pt-2'>
          {/* Progress line background - inset to align with circle centers using calc */}
          <div
            className='absolute top-7 h-1.5 rounded-full bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 md:top-8 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700'
            style={{ left: `calc(100% / ${ORDER_STEPS.length} / 2)`, right: `calc(100% / ${ORDER_STEPS.length} / 2)` }}
          >
            {/* Animated progress fill */}
            <motion.div
              role='progressbar'
              initial={{ width: 0 }}
              animate={{
                width: currentStepIndex >= 0 ? `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%` : '0%'
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className='h-full rounded-full bg-[#2dc258]'
              style={{
                boxShadow: '0 0 8px rgba(45, 194, 88, 0.3)'
              }}
            />
          </div>

          {/* Steps */}
          <div className='relative flex justify-between'>
            {ORDER_STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex
              const isCurrent = index === currentStepIndex
              const isFuture = index > currentStepIndex

              return (
                <div key={step.key} className='flex flex-1 flex-col items-center'>
                  {/* Step circle */}
                  <div
                    className={classNames(
                      'relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white md:h-14 md:w-14 dark:bg-slate-800',
                      {
                        'border-[#2dc258] text-[#2dc258]': isCompleted || isCurrent,
                        'border-gray-200 text-gray-300 dark:border-slate-600 dark:text-slate-400': isFuture
                      }
                    )}
                  >
                    <StepIcon type={step.key} className='h-5 w-5 md:h-6 md:w-6' isActive={isCompleted || isCurrent} />
                  </div>

                  {/* Step label */}
                  <span
                    className={classNames(
                      'mt-2 max-w-[72px] text-center text-[10px] leading-tight md:mt-3 md:max-w-[110px] md:text-xs',
                      {
                        'font-medium text-gray-900 dark:text-gray-100': isCompleted || isCurrent,
                        'font-medium text-gray-400 dark:text-slate-400': isFuture
                      }
                    )}
                  >
                    {step.key === 'confirmed' && orderTotal !== undefined
                      ? `${step.label} (₫${formatCurrency(orderTotal)})`
                      : step.label}
                  </span>

                  {/* Step timestamp */}
                  {(isCompleted || isCurrent) && stepTimestamps?.[step.key] && (
                    <span className='mt-0.5 text-center text-[10px] text-gray-400 md:text-xs dark:text-slate-500'>
                      {formatLastUpdate(stepTimestamps[step.key])}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
