import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { usePWAInstall } from 'src/hooks/usePWAInstall'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import Button from 'src/components/Button'

const AUTO_HIDE_DELAY = 10000 // 10 seconds

export default function PWAInstallPrompt() {
  const { t } = useTranslation('common')
  const { isInstallable, promptInstall, dismissPrompt } = usePWAInstall()
  const prefersReducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isInstallable) {
      setIsVisible(true)

      const timer = setTimeout(() => {
        setIsVisible(false)
      }, AUTO_HIDE_DELAY)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isInstallable])

  const handleInstall = async () => {
    await promptInstall()
    setIsVisible(false)
  }

  const handleDismiss = () => {
    dismissPrompt()
    setIsVisible(false)
  }

  const slideUpVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: 100, opacity: 0 }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className='fixed right-0 bottom-0 left-0 z-50 p-4 md:right-auto md:bottom-4 md:left-4 md:w-96'
          initial='hidden'
          animate='visible'
          exit='exit'
          variants={prefersReducedMotion ? undefined : slideUpVariants}
          transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className='flex items-center gap-3 rounded-lg bg-white p-4 shadow-lg ring-1 ring-gray-200 dark:bg-slate-800 dark:ring-slate-600'>
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange'>
              <svg className='h-7 w-7 text-white' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z' />
              </svg>
            </div>

            <div className='min-w-0 flex-1'>
              <h3 className='truncate text-sm font-semibold text-gray-900 dark:text-gray-100'>Shopee Clone</h3>
              <p className='text-xs text-gray-500 dark:text-gray-400'>{t('pwa.subtitle')}</p>
            </div>

            <div className='flex shrink-0 flex-col gap-2'>
              <Button
                variant='primary'
                size='sm'
                onClick={handleInstall}
                className='rounded-sm px-3 py-1.5 text-xs font-medium'
              >
                {t('pwa.install')}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleDismiss}
                className='rounded-sm px-3 py-1.5 text-xs font-medium'
              >
                {t('pwa.later')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
