import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { ANIMATION_DURATION, ANIMATION_EASING } from 'src/styles/animations'
import Button from 'src/components/Button'

// Display shortcut type that supports both single-key and sequence shortcuts
interface DisplayShortcut {
  key: string
  keys?: string[] // For sequence shortcuts display
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  description: string
  category: string
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: DisplayShortcut[]
}

const formatKeyDisplay = (shortcut: DisplayShortcut): string[] => {
  // Handle sequence shortcuts
  if (shortcut.keys && shortcut.keys.length > 0) {
    return shortcut.keys.map((k) => {
      if (k === 'Escape') return 'Esc'
      if (k === ' ') return 'Space'
      return k.toUpperCase()
    })
  }

  // Handle single-key shortcuts
  const keys: string[] = []

  if (shortcut.ctrlKey || shortcut.metaKey) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    keys.push(isMac ? '⌘' : 'Ctrl')
  }

  if (shortcut.shiftKey) {
    keys.push('Shift')
  }

  let keyDisplay = shortcut.key
  if (keyDisplay === 'Escape') keyDisplay = 'Esc'
  if (keyDisplay === ' ') keyDisplay = 'Space'

  keys.push(keyDisplay)
  return keys
}

const groupShortcutsByCategory = (shortcuts: DisplayShortcut[]): Record<string, DisplayShortcut[]> => {
  return shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(shortcut)
      return acc
    },
    {} as Record<string, DisplayShortcut[]>
  )
}

const KeyboardShortcutsModal = ({ isOpen, onClose, shortcuts }: KeyboardShortcutsModalProps) => {
  const { t } = useTranslation('common')
  const prefersReducedMotion = useReducedMotion()
  const modalRef = useRef<HTMLDivElement>(null)

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const groupedShortcuts = groupShortcutsByCategory(shortcuts)

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
      }
    : {
        hidden: { opacity: 0, scale: 0.95, y: -20 },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { duration: ANIMATION_DURATION.normal, ease: ANIMATION_EASING.easeOut }
        },
        exit: {
          opacity: 0,
          scale: 0.95,
          y: -20,
          transition: { duration: ANIMATION_DURATION.fast }
        }
      }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className='fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-xs'
          variants={backdropVariants}
          initial='hidden'
          animate='visible'
          exit='hidden'
          onClick={handleBackdropClick}
          transition={{ duration: prefersReducedMotion ? 0.1 : ANIMATION_DURATION.fast }}
        >
          <motion.div
            ref={modalRef}
            className='relative max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-6 shadow-2xl dark:bg-slate-800'
            variants={modalVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            role='dialog'
            aria-modal='true'
            aria-labelledby='keyboard-shortcuts-title'
          >
            <div className='mb-6 flex items-center justify-between'>
              <h2 id='keyboard-shortcuts-title' className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                {t('keyboard.title')}
              </h2>
              <Button
                variant='icon'
                animated={false}
                onClick={onClose}
                className='p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                aria-label={t('keyboard.close')}
              >
                <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </Button>
            </div>

            <div className='space-y-6'>
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category}>
                  <h3 className='mb-3 text-sm font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400'>
                    {category}
                  </h3>
                  <div className='space-y-2'>
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={`${shortcut.key}-${index}`}
                        className='flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-slate-700'
                      >
                        <span className='text-sm text-gray-700 dark:text-gray-200'>{shortcut.description}</span>
                        <div className='flex items-center gap-1'>
                          {formatKeyDisplay(shortcut).map((key, keyIndex, arr) => (
                            <span key={keyIndex} className='flex items-center gap-1'>
                              <kbd className='inline-flex min-w-[28px] items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-xs dark:border-slate-500 dark:bg-slate-600 dark:text-gray-200'>
                                {key}
                              </kbd>
                              {/* Show "then" separator for sequence shortcuts */}
                              {shortcut.keys && keyIndex < arr.length - 1 && (
                                <span className='text-xs text-gray-400 dark:text-gray-500'>{t('keyboard.then')}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default KeyboardShortcutsModal
