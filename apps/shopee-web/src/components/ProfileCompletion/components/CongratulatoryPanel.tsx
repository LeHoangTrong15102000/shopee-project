import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface CongratulatoryPanelProps {
  reducedMotion: boolean
}

const CongratulatoryPanel = ({ reducedMotion }: CongratulatoryPanelProps) => {
  const { t } = useTranslation('user')

  return (
    <motion.div
      className='hidden w-44 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200/50 bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 p-4 md:flex md:w-40 lg:w-48 lg:p-5 dark:border-amber-700/40 dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-orange-900/30'
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4, type: 'spring', stiffness: 200 }}
    >
      <motion.div
        className='flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-100/50 dark:shadow-amber-900/30'
        animate={reducedMotion ? {} : { scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <svg
          className='h-7 w-7 text-white'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={1.5}
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z'
          />
        </svg>
      </motion.div>
      <div className='text-center'>
        <p className='text-sm font-bold text-amber-700 dark:text-amber-300'>{t('profileCompletion.congrats.title')}</p>
        <p className='mt-1 text-[11px] leading-relaxed text-amber-600/80 dark:text-amber-400/80'>
          {t('profileCompletion.congrats.message')}
        </p>
      </div>
      <div className='flex items-center gap-1.5 rounded-full border border-amber-200/50 bg-amber-100 px-3 py-1.5 dark:border-amber-600/30 dark:bg-amber-800/40'>
        <div className='h-2 w-2 animate-pulse rounded-full bg-amber-500' aria-hidden='true' />
        <span className='text-[10px] font-semibold text-amber-700 dark:text-amber-300'>
          {t('profileCompletion.congrats.verified')}
        </span>
      </div>
    </motion.div>
  )
}

export default CongratulatoryPanel
