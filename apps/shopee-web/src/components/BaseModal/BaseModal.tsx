import { useEffect, useRef, useCallback, type ReactNode } from 'react'
import ReactDOM from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useFocusTrap } from 'src/hooks/useFocusTrap'

interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  overlayClassName?: string
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}

const BaseModal = ({
  isOpen,
  onClose,
  children,
  className = '',
  overlayClassName = '',
  closeOnBackdrop = true,
  closeOnEscape = true
}: BaseModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap({ isOpen, containerRef: modalRef, onClose })

  // Scroll lock
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

  // Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEscape, onClose])

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop) onClose()
  }, [closeOnBackdrop, onClose])

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 bg-black/50 ${overlayClassName}`}
            onClick={handleBackdropClick}
            aria-hidden='true'
          />
          <div className='pointer-events-none fixed inset-0 z-51 flex items-center justify-center'>
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              role='dialog'
              aria-modal='true'
              className={`pointer-events-auto mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800 ${className}`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default BaseModal
