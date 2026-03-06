import classNames from 'classnames'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { purchasesStatus } from 'src/constant/purchase'
import { ANIMATION_DURATION } from 'src/styles/animations'

interface OrderTimelineProps {
  orderId: string
  currentStatus: number // purchasesStatus value
  className?: string
  timestamps?: Record<number, string> // Optional timestamps for each status
}

const StepSvgIcon = ({ iconKey, className, isActive }: { iconKey: string; className?: string; isActive?: boolean }) => {
  const sw = isActive ? 2 : 1.5
  switch (iconKey) {
    case 'clock':
      return (
        <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={sw}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
      )
    case 'package':
      return (
        <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={sw}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
          />
        </svg>
      )
    case 'truck':
      return (
        <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={sw}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
          />
        </svg>
      )
    case 'check-circle':
      return (
        <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={sw}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      )
    default:
      return null
  }
}

const ORDER_STEPS = [
  { status: purchasesStatus.waitForConfirmation, label: 'Chờ xác nhận', icon: 'clock' },
  { status: purchasesStatus.waitForGetting, label: 'Chờ lấy hàng', icon: 'package' },
  { status: purchasesStatus.inProgress, label: 'Đang giao', icon: 'truck' },
  { status: purchasesStatus.delivered, label: 'Đã giao', icon: 'check-circle' }
]

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${hours}:${minutes} ${day}-${month}-${year}`
}

export default function OrderTimeline({ orderId: _orderId, currentStatus, className, timestamps }: OrderTimelineProps) {
  const isCancelled = currentStatus === purchasesStatus.cancelled

  const currentStepIndex = useMemo(() => {
    if (isCancelled) return -1
    return ORDER_STEPS.findIndex((step) => step.status === currentStatus)
  }, [currentStatus, isCancelled])

  // Cancelled state
  if (isCancelled) {
    return (
      <div className={classNames('relative', className)}>
        <motion.div
          className='flex items-center gap-4 rounded-xl border border-red-200 bg-linear-to-r from-red-50 to-rose-50 p-4 dark:border-red-800 dark:from-red-900/30 dark:to-rose-900/30'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: ANIMATION_DURATION.normal }}
        >
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-200 dark:shadow-red-900/50'>
            <svg className='h-6 w-6 text-white' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div>
            <span className='text-lg font-semibold text-red-600 dark:text-red-400'>Đơn hàng đã hủy</span>
            <p className='mt-1 text-sm text-red-500/80 dark:text-red-400/70'>
              Đơn hàng này đã bị hủy bởi người bán hoặc người mua
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={classNames('relative pt-2', className)}>
      {/* Horizontal progress line background */}
      <div
        className='absolute top-7 h-1.5 rounded-full bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 md:top-8 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700'
        style={{
          left: `calc(100% / ${ORDER_STEPS.length} / 2)`,
          right: `calc(100% / ${ORDER_STEPS.length} / 2)`
        }}
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
          style={{ boxShadow: '0 0 8px rgba(45, 194, 88, 0.3)' }}
        />
      </div>

      {/* Steps */}
      <div className='relative flex justify-between'>
        {ORDER_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex
          const isCurrent = index === currentStepIndex
          const isFuture = index > currentStepIndex
          const timestamp = timestamps?.[step.status]

          return (
            <div key={step.status} className='flex flex-1 flex-col items-center'>
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
                <StepSvgIcon
                  iconKey={step.icon}
                  className='h-5 w-5 md:h-6 md:w-6'
                  isActive={isCompleted || isCurrent}
                />
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
                {step.label}
              </span>

              {/* Step timestamp */}
              {(isCompleted || isCurrent) && timestamp && (
                <span className='mt-0.5 text-center text-[10px] text-gray-400 md:text-xs dark:text-slate-500'>
                  {formatDateTime(timestamp)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
