import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface BenefitsPanelProps {
  reducedMotion: boolean
}

const BENEFITS = [
  {
    id: 'security',
    icon: (
      <svg
        className='h-4 w-4 text-white'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.5}
        aria-hidden='true'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z'
        />
      </svg>
    ),
    titleKey: 'profileCompletion.benefits.security.title',
    descKey: 'profileCompletion.benefits.security.desc'
  },
  {
    id: 'rewards',
    icon: (
      <svg
        className='h-4 w-4 text-white'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.5}
        aria-hidden='true'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'
        />
      </svg>
    ),
    titleKey: 'profileCompletion.benefits.rewards.title',
    descKey: 'profileCompletion.benefits.rewards.desc'
  },
  {
    id: 'shipping',
    icon: (
      <svg
        className='h-4 w-4 text-white'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.5}
        aria-hidden='true'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
        />
      </svg>
    ),
    titleKey: 'profileCompletion.benefits.shipping.title',
    descKey: 'profileCompletion.benefits.shipping.desc'
  }
]

const BenefitsPanel = ({ reducedMotion }: BenefitsPanelProps) => {
  const { t } = useTranslation('user')

  return (
    <motion.div
      className='hidden w-44 shrink-0 flex-col gap-3 md:flex md:w-40 lg:w-48'
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h4 className='text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400'>
        {t('profileCompletion.benefits.title')}
      </h4>
      {BENEFITS.map((item, i) => (
        <motion.div
          key={item.id}
          className='flex items-start gap-2.5 rounded-xl border border-gray-100 bg-linear-to-br from-gray-50 to-slate-50 p-3 dark:border-slate-700/50 dark:from-slate-700/50 dark:to-slate-800/50'
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
        >
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-orange-400 to-amber-500'>
            {item.icon}
          </div>
          <div>
            <p className='text-xs font-semibold text-gray-700 dark:text-gray-200'>
              {t(
                item.titleKey as
                  | 'profileCompletion.benefits.security.title'
                  | 'profileCompletion.benefits.rewards.title'
                  | 'profileCompletion.benefits.shipping.title'
              )}
            </p>
            <p className='mt-0.5 text-[10px] leading-tight text-gray-500 dark:text-gray-400'>
              {t(
                item.descKey as
                  | 'profileCompletion.benefits.security.desc'
                  | 'profileCompletion.benefits.rewards.desc'
                  | 'profileCompletion.benefits.shipping.desc'
              )}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default BenefitsPanel
