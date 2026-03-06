import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import Button from 'src/components/Button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

const variantConfig = {
  danger: {
    iconColor: 'text-red-500',
    buttonClass: 'bg-red-500 hover:bg-red-600 text-white'
  },
  warning: {
    iconColor: 'text-yellow-500',
    buttonClass: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  },
  info: {
    iconColor: 'text-blue-500',
    buttonClass: 'bg-orange hover:bg-[#d73211] text-white'
  }
}

// SVG Icons for each variant
const DangerIcon = () => (
  <svg className='h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    />
  </svg>
)

const WarningIcon = () => (
  <svg className='h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
  </svg>
)

const InfoIcon = () => (
  <svg className='h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
  </svg>
)

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false
}: ConfirmDialogProps) => {
  const { t } = useTranslation('common')
  const reducedMotion = useReducedMotion()
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const config = variantConfig[variant]

  const resolvedConfirmText = confirmText || t('confirm.defaultConfirm')
  const resolvedCancelText = cancelText || t('confirm.defaultCancel')

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Auto-focus cancel button when dialog opens
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus()
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isLoading) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isLoading, onClose])

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return <DangerIcon />
      case 'warning':
        return <WarningIcon />
      case 'info':
        return <InfoIcon />
    }
  }

  const animationProps = reducedMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2 }
      }

  const backdropAnimationProps = reducedMotion
    ? { initial: false }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 0.5 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 }
      }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            {...backdropAnimationProps}
            className='fixed inset-0 z-50 bg-black dark:bg-black/70'
            onClick={!isLoading ? onClose : undefined}
            aria-hidden='true'
          />

          {/* Dialog container */}
          <div className='pointer-events-none fixed inset-0 z-51 flex items-center justify-center'>
            <motion.div
              {...animationProps}
              role='dialog'
              aria-modal='true'
              aria-labelledby='confirm-dialog-title'
              aria-describedby='confirm-dialog-message'
              className='pointer-events-auto mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className={`flex justify-center ${config.iconColor}`}>{renderIcon()}</div>

              {/* Title */}
              <h2
                id='confirm-dialog-title'
                className='mt-4 text-center text-xl font-semibold text-gray-900 dark:text-gray-100'
              >
                {title}
              </h2>

              {/* Message */}
              <p id='confirm-dialog-message' className='mt-2 text-center text-gray-600 dark:text-gray-300'>
                {message}
              </p>

              {/* Buttons */}
              <div className='mt-6 flex gap-3'>
                <Button
                  ref={cancelButtonRef}
                  variant='secondary'
                  type='button'
                  disabled={isLoading}
                  onClick={onClose}
                  className='flex-1 rounded-md px-4 py-2 font-medium'
                >
                  {resolvedCancelText}
                </Button>
                <Button
                  variant='danger'
                  type='button'
                  disabled={isLoading}
                  isLoading={isLoading}
                  onClick={onConfirm}
                  className='flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 font-medium'
                >
                  {resolvedConfirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ConfirmDialog
