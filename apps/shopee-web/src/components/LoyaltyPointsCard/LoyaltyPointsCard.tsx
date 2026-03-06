import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import classNames from 'classnames'
import { LoyaltyPoints } from 'src/types/loyalty.type'
import { formatCurrency } from 'src/utils/utils'
import Button from 'src/components/Button'

interface LoyaltyPointsCardProps {
  points: LoyaltyPoints
  nextRewardThreshold?: number
  className?: string
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${day}/${month}`
}

const getDaysUntilExpiry = (dateString: string): number => {
  const expireDate = new Date(dateString)
  const now = new Date()
  const diffTime = expireDate.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const CoinIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox='0 0 24 24' fill='currentColor'>
    <circle cx='12' cy='12' r='10' fill='url(#coinGradient)' />
    <text x='12' y='16' textAnchor='middle' fontSize='10' fontWeight='bold' fill='#B8860B'>
      ₫
    </text>
    <defs>
      <linearGradient id='coinGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stopColor='#FFD700' />
        <stop offset='50%' stopColor='#FFA500' />
        <stop offset='100%' stopColor='#FF8C00' />
      </linearGradient>
    </defs>
  </svg>
)

export default function LoyaltyPointsCard({
  points,
  nextRewardThreshold = 1000,
  className = ''
}: LoyaltyPointsCardProps) {
  const { t } = useTranslation('checkin')
  const [displayPoints, setDisplayPoints] = useState(points.available_points)
  const [isAnimating, setIsAnimating] = useState(false)

  const progressPercentage = Math.min((points.available_points / nextRewardThreshold) * 100, 100)
  const pointsToNextReward = Math.max(nextRewardThreshold - points.available_points, 0)
  const daysUntilExpiry = getDaysUntilExpiry(points.expiring_soon.expire_date)
  const showExpiryWarning = points.expiring_soon.points > 0 && daysUntilExpiry <= 7

  useEffect(() => {
    if (displayPoints !== points.available_points) {
      setIsAnimating(true)
      const diff = points.available_points - displayPoints
      const steps = 20
      const increment = diff / steps
      let current = displayPoints
      let step = 0

      const interval = setInterval(() => {
        step++
        current += increment
        if (step >= steps) {
          setDisplayPoints(points.available_points)
          setIsAnimating(false)
          clearInterval(interval)
        } else {
          setDisplayPoints(Math.round(current))
        }
      }, 30)

      return () => clearInterval(interval)
    }
  }, [points.available_points, displayPoints])

  return (
    <motion.div
      className={classNames(
        'relative overflow-hidden rounded-xl bg-linear-to-br from-amber-400 via-orange-400 to-orange-500 p-4 shadow-lg',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background decoration */}
      <div className='absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10' />
      <div className='absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/10' />

      {/* Header */}
      <div className='relative flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <CoinIcon className='h-8 w-8 drop-shadow-md' />
          <span className='text-lg font-bold text-white drop-shadow-xs'>{t('loyalty.title')}</span>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            animated={false}
            className='rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-xs transition-colors hover:bg-white/30'
          >
            {t('loyalty.history')}
          </Button>
        </motion.div>
      </div>

      {/* Main points display */}
      <div className='relative mt-4'>
        <div className='flex items-baseline gap-1'>
          <motion.span
            className={classNames('text-4xl font-bold text-white drop-shadow-md', {
              'animate-pulse': isAnimating
            })}
            key={displayPoints}
          >
            {formatCurrency(displayPoints)}
          </motion.span>
          <span className='text-sm font-medium text-white/80'>{t('loyalty.available')}</span>
        </div>

        {/* Points breakdown */}
        <div className='mt-3 flex gap-4 text-xs text-white/90'>
          <div className='flex flex-col'>
            <span className='font-medium'>{formatCurrency(points.total_points)}</span>
            <span className='text-white/70'>{t('loyalty.totalPoints')}</span>
          </div>
          <div className='h-8 w-px bg-white/30' />
          <div className='flex flex-col'>
            <span className='font-medium'>{formatCurrency(points.pending_points)}</span>
            <span className='text-white/70'>{t('loyalty.pendingPoints')}</span>
          </div>
        </div>
      </div>

      {/* Progress bar to next reward */}
      <div className='relative mt-4'>
        <div className='flex items-center justify-between text-xs text-white/90'>
          <span>{t('loyalty.progressLabel')}</span>
          <span className='font-medium'>
            {pointsToNextReward > 0 ? t('loyalty.remaining', { count: pointsToNextReward }) : t('loyalty.eligible')}
          </span>
        </div>
        <div className='mt-2 h-2 overflow-hidden rounded-full bg-white/30'>
          <motion.div
            className='h-full rounded-full bg-linear-to-r from-yellow-300 to-white'
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className='mt-1 flex justify-between text-[10px] text-white/70'>
          <span>0</span>
          <span>{formatCurrency(nextRewardThreshold)}</span>
        </div>
      </div>

      {/* Expiring soon warning */}
      <AnimatePresence>
        {showExpiryWarning && (
          <motion.div
            className='relative mt-3 flex items-center gap-2 rounded-lg bg-red-500/20 px-3 py-2 backdrop-blur-xs'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <svg className='h-4 w-4 shrink-0 text-yellow-200' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
            <div className='flex-1 text-xs text-white'>
              {t('loyalty.expiryWarning', {
                count: points.expiring_soon.points,
                date: formatDate(points.expiring_soon.expire_date)
              })}
              {daysUntilExpiry <= 3 && (
                <span className='ml-1 text-yellow-200'>({t('loyalty.expiryDays', { count: daysUntilExpiry })})</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
