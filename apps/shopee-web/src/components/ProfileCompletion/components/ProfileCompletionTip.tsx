import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import path from 'src/constant/path'

interface ProfileCompletionTipProps {
  reducedMotion: boolean
}

const ProfileCompletionTip = ({ reducedMotion }: ProfileCompletionTipProps) => {
  const { t } = useTranslation('user')

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reducedMotion ? 0 : 0.5 }}
      className='mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100/50 bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 px-4 py-3 shadow-xs sm:px-5 sm:py-4 dark:border-blue-800/50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30'
      role='alert'
    >
      <motion.div
        className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-400 to-indigo-500 shadow-md'
        animate={reducedMotion ? {} : { rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <svg className='h-5 w-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
          />
        </svg>
      </motion.div>
      <div className='flex-1'>
        <p className='text-sm font-semibold text-blue-700 dark:text-blue-200'>{t('profileCompletion.tip.title')}</p>
        <p className='mt-0.5 text-xs text-blue-600/80 dark:text-blue-300/80'>{t('profileCompletion.tip.message')}</p>
      </div>
      <Link
        to={path.profile}
        className='flex shrink-0 items-center gap-1 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all duration-300 hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30'
      >
        {t('profileCompletion.tip.button')}
        <svg className='h-3 w-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3' />
        </svg>
      </Link>
    </motion.div>
  )
}

export default ProfileCompletionTip
