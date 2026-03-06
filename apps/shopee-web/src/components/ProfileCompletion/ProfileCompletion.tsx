import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { User } from 'src/types/user.type'
import { PROFILE_FIELDS, isFieldComplete } from './profileCompletion.constants'
import CircularProgressRing from './components/CircularProgressRing'
import ProfileFieldCard from './components/ProfileFieldCard'
import BenefitsPanel from './components/BenefitsPanel'
import CongratulatoryPanel from './components/CongratulatoryPanel'
import ProfileCompletionTip from './components/ProfileCompletionTip'

interface ProfileCompletionProps {
  user: User | null
  className?: string
  compact?: boolean
}

const ProfileCompletion = ({ user, className = '', compact = false }: ProfileCompletionProps) => {
  const { t } = useTranslation('user')
  const reducedMotion = useReducedMotion()

  const { percentage, completedFields, incompleteFields } = useMemo(() => {
    let totalWeight = 0
    const completed: (typeof PROFILE_FIELDS)[number][] = []
    const incomplete: (typeof PROFILE_FIELDS)[number][] = []

    PROFILE_FIELDS.forEach((field) => {
      if (isFieldComplete(user, field.key)) {
        totalWeight += field.weight
        completed.push(field)
      } else {
        incomplete.push(field)
      }
    })

    return {
      percentage: totalWeight,
      completedFields: completed,
      incompleteFields: incomplete
    }
  }, [user])

  // SVG circle properties
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Get status color based on percentage - using beautiful gradient for 100%
  const getStatusColor = () => {
    if (percentage === 100) return { from: '#ee4d2d', to: '#ff6633' } // Shopee orange gradient
    if (percentage >= 60) return { from: '#f97316', to: '#ea580c' }
    return { from: '#f59e0b', to: '#d97706' }
  }
  const statusColor = getStatusColor()

  if (compact) {
    return (
      <div className={`mt-4 px-2 ${className}`}>
        <div className='mb-2 text-sm font-medium text-gray-600 dark:text-gray-300'>
          {percentage === 100 ? (
            <span className='flex items-center gap-1 text-green-600 dark:text-green-400'>
              <svg
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              {t('profileCompletion.completed')}
            </span>
          ) : (
            t('profileCompletion.progress', { percent: percentage })
          )}
        </div>
        <div
          className='h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700'
          role='progressbar'
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('profileCompletion.progressAria', { percent: percentage })}
        >
          <motion.div
            className='h-full rounded-full bg-linear-to-r from-[#ee4d2d] to-[#ff6633]'
            initial={reducedMotion ? { width: `${percentage}%` } : { width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    )
  }

  // Full version - Enhanced UI
  return (
    <div className={`relative mt-6 overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-slate-800 ${className}`}>
      {/* Header with gradient */}
      <div className='relative bg-linear-to-r from-orange-500 via-orange-400 to-amber-400 px-4 py-4 sm:px-5 sm:py-5 md:px-6'>
        {/* Decorative pattern overlay */}
        <div className='absolute inset-0 opacity-20'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
        </div>
        <div className='relative flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-bold text-white'>{t('profileCompletion.title')}</h3>
            <p className='mt-1 text-sm text-white/80'>
              {percentage === 100
                ? t('profileCompletion.complete')
                : t('profileCompletion.remaining', { count: incompleteFields.length })}
            </p>
          </div>
          {percentage === 100 && (
            <motion.div
              initial={reducedMotion ? { scale: 1 } : { scale: 0 }}
              animate={{ scale: 1 }}
              className='flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs'
              aria-hidden='true'
            >
              <svg
                className='h-7 w-7 text-white'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth={1.5}
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z'
                />
              </svg>
            </motion.div>
          )}
        </div>
      </div>

      <div className='p-4 sm:p-5 md:p-6'>
        <div className='flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8'>
          <CircularProgressRing
            percentage={percentage}
            circumference={circumference}
            strokeDashoffset={strokeDashoffset}
            statusColor={statusColor}
            reducedMotion={reducedMotion}
            radius={radius}
          />

          <ProfileFieldCard completedFields={completedFields} reducedMotion={reducedMotion} />

          {percentage < 100 && <BenefitsPanel reducedMotion={reducedMotion} />}

          {percentage === 100 && <CongratulatoryPanel reducedMotion={reducedMotion} />}
        </div>

        {percentage < 100 && <ProfileCompletionTip reducedMotion={reducedMotion} />}
      </div>
    </div>
  )
}

export default ProfileCompletion
