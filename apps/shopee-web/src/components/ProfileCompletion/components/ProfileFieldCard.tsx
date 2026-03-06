import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import path from 'src/constant/path'
import { PROFILE_FIELDS, ProfileIcons, ShimmerEffect, FloatingParticle } from '../profileCompletion.constants'

interface ProfileFieldCardProps {
  completedFields: (typeof PROFILE_FIELDS)[number][]
  reducedMotion: boolean
}

const ProfileFieldCard = ({ completedFields, reducedMotion }: ProfileFieldCardProps) => {
  const { t } = useTranslation('user')

  return (
    <div className='w-full grow'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2'>
        {PROFILE_FIELDS.map((field, index) => {
          const isComplete = completedFields.some((f) => f.key === field.key)
          const IconComponent = ProfileIcons[field.key]
          return (
            <motion.div
              key={field.key}
              className={`relative flex cursor-default items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 ${
                isComplete
                  ? 'border border-emerald-200/60 bg-linear-to-br from-emerald-50 via-emerald-50 to-teal-50 shadow-xs hover:shadow-md hover:shadow-emerald-100/50 dark:border-emerald-700/50 dark:from-emerald-900/40 dark:via-emerald-900/30 dark:to-teal-900/40 dark:hover:shadow-emerald-900/30'
                  : 'border border-orange-200/60 bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-xs hover:shadow-md hover:shadow-orange-100/50 dark:border-orange-700/50 dark:from-orange-900/40 dark:via-amber-900/30 dark:to-yellow-900/40 dark:hover:shadow-orange-900/30'
              }`}
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.08 * index, ease: 'easeOut' }}
              whileHover={reducedMotion ? {} : { scale: 1.03, y: -2 }}
            >
              {/* Shimmer effect for incomplete fields */}
              {!isComplete && !reducedMotion && <ShimmerEffect />}

              {/* Floating particles for visual interest */}
              {!isComplete && !reducedMotion && (
                <div className='pointer-events-none absolute inset-0'>
                  <FloatingParticle delay={index * 0.3} size={4} color='bg-orange-300/40' />
                  <FloatingParticle delay={index * 0.3 + 0.5} size={3} color='bg-amber-300/40' />
                </div>
              )}

              {/* Icon container with gradient background */}
              <motion.div
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                  isComplete
                    ? 'bg-linear-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600'
                    : 'bg-linear-to-br from-orange-400 to-amber-500 dark:from-orange-500 dark:to-amber-600'
                }`}
                whileHover={reducedMotion ? {} : { rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
              >
                {IconComponent(`h-4 w-4 text-white drop-shadow-xs`)}
              </motion.div>

              {/* Label with enhanced typography */}
              <span
                className={`flex-1 text-sm font-semibold whitespace-nowrap ${isComplete ? 'text-emerald-700 dark:text-emerald-200' : 'text-gray-700 dark:text-gray-200'}`}
              >
                {t(
                  `profileCompletion.fields.${field.key}` as
                    | 'profileCompletion.fields.name'
                    | 'profileCompletion.fields.avatar'
                    | 'profileCompletion.fields.phone'
                    | 'profileCompletion.fields.address'
                    | 'profileCompletion.fields.date_of_birth'
                )}
              </span>

              {/* Status indicator */}
              {isComplete ? (
                <motion.div
                  className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-500 shadow-md'
                  aria-label={t('profileCompletion.fieldCompleted')}
                  initial={reducedMotion ? {} : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 * index }}
                >
                  <svg
                    className='h-3.5 w-3.5 text-white drop-shadow-xs'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={3}
                    aria-hidden='true'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                  </svg>
                </motion.div>
              ) : (
                <Link
                  to={path.profile}
                  className='group relative flex shrink-0 items-center gap-1 overflow-hidden rounded-full bg-linear-to-r from-orange-500 to-amber-500 px-2.5 py-1 text-xs font-semibold text-white transition-all duration-300 hover:from-orange-600 hover:to-amber-600 hover:shadow-lg hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30'
                >
                  <span className='relative z-10'>{t('profileCompletion.fieldUpdate')}</span>
                  <svg
                    className='relative z-10 h-3 w-3 transition-transform group-hover:translate-x-0.5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3' />
                  </svg>
                  {/* Button shine effect */}
                  <motion.div
                    className='absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent'
                    animate={{ translateX: ['100%', '-100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    aria-hidden='true'
                  />
                </Link>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default ProfileFieldCard
