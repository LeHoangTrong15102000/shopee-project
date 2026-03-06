import { memo, useEffect } from 'react'
import { motion } from 'framer-motion'

// ---- EWallet-style CountdownTimer ----
const QR_EXPIRATION_SECONDS = 300

const formatTimeSimple = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const EWalletCountdownTimer = memo(function EWalletCountdownTimer({
  seconds,
  isExpired
}: {
  seconds: number
  isExpired: boolean
}) {
  const progressPercent = (seconds / QR_EXPIRATION_SECONDS) * 100
  const isWarning = seconds <= 60

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='relative h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700'>
        <motion.div
          className={`absolute top-0 left-0 h-full ${isWarning ? 'bg-red-500' : 'bg-green-500'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span
        className={`text-sm font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}
      >
        {isExpired ? 'Đã hết hạn' : `Còn lại: ${formatTimeSimple(seconds)}`}
      </span>
    </div>
  )
})

// ---- BankTransfer-style CountdownTimer ----
const PAYMENT_DEADLINE_SECONDS = 24 * 60 * 60
const WARNING_THRESHOLD_SECONDS = 60 * 60

const formatTimeParts = (seconds: number): { hours: number; minutes: number; secs: number } => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return { hours, minutes, secs }
}

export const BankTransferCountdownTimer = memo(function BankTransferCountdownTimer({
  seconds,
  onExpired
}: {
  seconds: number
  onExpired: () => void
}) {
  const isWarning = seconds <= WARNING_THRESHOLD_SECONDS && seconds > 0
  const isExpired = seconds <= 0
  const { hours, minutes, secs } = formatTimeParts(Math.max(0, seconds))

  useEffect(() => {
    if (isExpired) {
      onExpired()
    }
  }, [isExpired, onExpired])

  const progressPercent = (seconds / PAYMENT_DEADLINE_SECONDS) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 ${isExpired ? 'bg-red-50' : isWarning ? 'bg-orange-50' : 'bg-blue-50'}`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <svg
            className={`h-5 w-5 ${isExpired ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-blue-500'}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span
            className={`text-sm font-medium ${isExpired ? 'text-red-700' : isWarning ? 'text-orange-700' : 'text-blue-700'}`}
          >
            {isExpired ? 'Đã hết hạn thanh toán' : 'Thời hạn thanh toán'}
          </span>
        </div>
        {!isExpired && (
          <div className='flex items-center gap-1 font-mono text-lg font-bold'>
            <span
              className={`rounded-sm px-2 py-1 ${isWarning ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}
            >
              {hours.toString().padStart(2, '0')}
            </span>
            <span className={isWarning ? 'text-orange-600' : 'text-blue-600'}>:</span>
            <span
              className={`rounded-sm px-2 py-1 ${isWarning ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}
            >
              {minutes.toString().padStart(2, '0')}
            </span>
            <span className={isWarning ? 'text-orange-600' : 'text-blue-600'}>:</span>
            <span
              className={`rounded-sm px-2 py-1 ${isWarning ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}
            >
              {secs.toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {!isExpired && (
        <div className='mt-3'>
          <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200'>
            <motion.div
              className={`h-full ${isWarning ? 'bg-orange-500' : 'bg-blue-500'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {isWarning && !isExpired && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='mt-2 flex items-center gap-1 text-xs text-orange-600'
        >
          <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          </svg>
          Sắp hết hạn! Vui lòng hoàn tất chuyển khoản ngay.
        </motion.p>
      )}

      {isExpired && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='mt-2 text-sm text-red-600'>
          Đơn hàng đã bị hủy do quá thời hạn thanh toán. Vui lòng đặt hàng lại.
        </motion.p>
      )}
    </motion.div>
  )
})
