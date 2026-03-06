import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import Button from 'src/components/Button'

interface NetworkErrorProps {
  onRetry?: () => void
  autoRetry?: boolean
  autoRetryInterval?: number
  maxAutoRetries?: number
  className?: string
}

export default function NetworkError({
  onRetry,
  autoRetry = false,
  autoRetryInterval = 5000,
  maxAutoRetries = 3,
  className = ''
}: NetworkErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [autoRetryCount, setAutoRetryCount] = useState(0)
  const [countdown, setCountdown] = useState(0)

  const handleRetry = useCallback(async () => {
    if (!onRetry) return

    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setTimeout(() => setIsRetrying(false), 500)
    }
  }, [onRetry])

  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!autoRetry || autoRetryCount >= maxAutoRetries) return

    setCountdown(Math.ceil(autoRetryInterval / 1000))

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    const retryTimer = setTimeout(() => {
      setAutoRetryCount((prev) => prev + 1)
      handleRetry()
    }, autoRetryInterval)

    return () => {
      clearInterval(countdownTimer)
      clearTimeout(retryTimer)
    }
  }, [autoRetry, autoRetryCount, autoRetryInterval, maxAutoRetries, handleRetry])

  return (
    <motion.div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
      initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
      animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Network Icon */}
      <motion.div
        className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700'
        initial={reducedMotion ? undefined : { scale: 0 }}
        animate={reducedMotion ? undefined : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
      >
        <svg
          className='h-8 w-8 text-gray-400 dark:text-gray-500'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={2}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414'
          />
        </svg>
      </motion.div>

      {/* Title */}
      <motion.h3
        className='mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100'
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        Mất kết nối mạng
      </motion.h3>

      {/* Message */}
      <motion.p
        className='mb-4 text-center text-sm text-gray-500 dark:text-gray-400'
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        Vui lòng kiểm tra kết nối internet của bạn và thử lại.
      </motion.p>

      {/* Auto Retry Info */}
      {autoRetry && autoRetryCount < maxAutoRetries && countdown > 0 && (
        <p className='mb-4 text-xs text-gray-400 dark:text-gray-500'>
          Tự động thử lại sau {countdown} giây... ({autoRetryCount + 1}/{maxAutoRetries})
        </p>
      )}

      {autoRetry && autoRetryCount >= maxAutoRetries && (
        <p className='mb-4 text-xs text-red-500 dark:text-red-400'>
          Đã hết số lần tự động thử lại. Vui lòng thử lại thủ công.
        </p>
      )}

      {/* Retry Button */}
      {onRetry && (
        <Button
          variant='primary'
          animated={false}
          onClick={handleRetry}
          disabled={isRetrying}
          className='flex items-center gap-2 rounded-xs px-6 py-2 text-sm font-medium'
        >
          {isRetrying ? (
            <>
              <svg className='h-4 w-4 animate-spin' viewBox='0 0 24 24' fill='none'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              <span>Đang kết nối...</span>
            </>
          ) : (
            <>
              <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
              <span>Thử lại</span>
            </>
          )}
        </Button>
      )}
    </motion.div>
  )
}
