import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import Button from 'src/components/Button'

interface ErrorFallbackProps {
  error?: Error | null
  resetErrorBoundary?: () => void
  title?: string
  message?: string
  showRetry?: boolean
  retryText?: string
  className?: string
}

export default function ErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Đã xảy ra lỗi',
  message = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  showRetry = true,
  retryText = 'Thử lại',
  className = ''
}: ErrorFallbackProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const isDevelopment = import.meta.env.DEV
  const reducedMotion = useReducedMotion()

  const handleRetry = async () => {
    if (!resetErrorBoundary) return

    setIsRetrying(true)
    try {
      await resetErrorBoundary()
    } finally {
      setTimeout(() => setIsRetrying(false), 500)
    }
  }

  return (
    <motion.div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
      initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
      animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Error Icon */}
      <motion.div
        className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'
        initial={reducedMotion ? undefined : { scale: 0 }}
        animate={reducedMotion ? undefined : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
      >
        <svg className='h-8 w-8 text-orange' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
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
        {title}
      </motion.h3>

      {/* Message */}
      <motion.p
        className='mb-4 text-center text-sm text-gray-500 dark:text-gray-400'
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        {message}
      </motion.p>

      {/* Error Details (Development Mode) */}
      {isDevelopment && error && (
        <details className='mb-4 w-full max-w-md rounded-md bg-gray-100 p-3 dark:bg-slate-700'>
          <summary className='cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200'>
            Chi tiết lỗi (Dev)
          </summary>
          <div className='mt-2 overflow-auto'>
            <p className='text-xs text-red-600 dark:text-red-400'>
              {error.name}: {error.message}
            </p>
            {error.stack && (
              <pre className='mt-2 max-h-32 overflow-auto text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-300'>
                {error.stack}
              </pre>
            )}
          </div>
        </details>
      )}

      {/* Retry Button */}
      {showRetry && resetErrorBoundary && (
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
              <span>Đang thử lại...</span>
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
              <span>{retryText}</span>
            </>
          )}
        </Button>
      )}
    </motion.div>
  )
}
