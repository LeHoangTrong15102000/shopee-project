import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import classNames from 'classnames'
import useDailyCheckIn from 'src/hooks/useDailyCheckIn'
import { DEFAULT_CHECKIN_CONFIG } from 'src/types/checkin.type'
import Button from 'src/components/Button'

interface DailyCheckInProps {
  className?: string
}

const DailyCheckIn = memo(function DailyCheckIn({ className }: DailyCheckInProps) {
  const { t } = useTranslation('checkin')
  const { streak, totalCoins, canCheckInToday, checkIn, getMonthCalendar, nextReward, streakProgress } =
    useDailyCheckIn()

  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [isChecking, setIsChecking] = useState(false)

  const handleCheckIn = useCallback(async () => {
    if (!canCheckInToday || isChecking) return

    setIsChecking(true)

    const reward = await checkIn()
    if (reward) {
      toast.success(t('toast.success', { value: reward.value }), {
        autoClose: 3000,
        position: 'top-center'
      })
    }
    setIsChecking(false)
  }, [canCheckInToday, isChecking, checkIn, t])

  const calendar = getMonthCalendar(currentMonth.year, currentMonth.month)
  const monthNames = t('months', { returnObjects: true }) as string[]
  const dayNames = t('days', { returnObjects: true }) as string[]

  const firstDayOfMonth = new Date(currentMonth.year, currentMonth.month, 1).getDay()

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { ...prev, month: prev.month + 1 }
    })
  }

  const milestones = Object.keys(DEFAULT_CHECKIN_CONFIG.streakBonuses)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div
      className={classNames(
        'overflow-hidden rounded-lg bg-white shadow-lg dark:border dark:border-slate-700 dark:bg-slate-800',
        className
      )}
    >
      {/* Header */}
      <div className='bg-linear-to-r from-orange to-[#ff6633] p-4 text-white'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-base font-bold md:text-lg'>{t('title')}</h3>
            <p className='text-sm text-white/80'>{t('subtitle')}</p>
          </div>
          <div className='text-right'>
            <div className='flex items-center gap-1'>
              <svg className='h-5 w-5 text-yellow-300' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0H8z' />
              </svg>
              <span className='text-lg font-bold md:text-xl'>{totalCoins}</span>
            </div>
            <p className='text-xs text-white/70'>{t('yourCoins')}</p>
          </div>
        </div>
      </div>

      {/* Streak Info */}
      <div className='border-b border-gray-100 p-4 dark:border-slate-700'>
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <svg viewBox='0 0 24 24' className='h-7 w-7 shrink-0'>
              <defs>
                <linearGradient id='fireGrad' x1='12' y1='2' x2='12' y2='23' gradientUnits='userSpaceOnUse'>
                  <stop stopColor='#FBBF24' />
                  <stop offset='1' stopColor='#EE4D2D' />
                </linearGradient>
              </defs>
              <path
                d='M12 23c-4.97 0-9-3.58-9-8 0-3.19 2.13-6.17 3.5-7.56.37-.37.98-.1.98.42 0 1.63.81 2.96 2.02 3.64C9.82 7.98 11 4.5 12 2c1 2.5 2.18 5.98 2.5 9.5 1.21-.68 2.02-2.01 2.02-3.64 0-.52.61-.79.98-.42C18.87 8.83 21 11.81 21 15c0 4.42-4.03 8-9 8z'
                fill='url(#fireGrad)'
              />
            </svg>
            <div>
              <p className='font-medium text-gray-900 dark:text-gray-100'>{t('streak', { count: streak.current })}</p>
              <p className='text-xs text-gray-600 dark:text-gray-300'>{t('record', { count: streak.longest })}</p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-sm text-gray-600 dark:text-gray-300'>{t('nextReward')}</p>
            <p className='font-bold text-orange dark:text-orange-400'>+{nextReward.value} xu</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='relative'>
          <div className='h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700'>
            <motion.div
              className='h-full bg-linear-to-r from-orange to-[#ff6633]'
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(streakProgress.progress, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {/* Milestones */}
          <div className='mt-1 flex justify-between'>
            {milestones.map((milestone) => (
              <div key={milestone} className='text-center' style={{ width: `${100 / milestones.length}%` }}>
                <div
                  className={classNames(
                    'text-xs font-medium',
                    streak.current >= milestone
                      ? 'text-orange dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-300'
                  )}
                >
                  {t('milestone', { count: milestone })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Check-in Button */}
      <div className='p-4'>
        {canCheckInToday ? (
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              animated={false}
              onClick={handleCheckIn}
              disabled={isChecking}
              className='w-full cursor-pointer rounded-lg bg-linear-to-r from-orange to-[#ff6633] py-3 text-lg font-bold text-white transition-all hover:shadow-lg'
            >
              {isChecking ? (
                <span className='flex items-center justify-center gap-2'>
                  <svg className='h-5 w-5 animate-spin' viewBox='0 0 24 24'>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                      fill='none'
                    />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                  </svg>
                  {t('checkingIn')}
                </span>
              ) : (
                t('checkInButton', { value: nextReward.value })
              )}
            </Button>
          </motion.div>
        ) : (
          /* Checked-in Success State - Beautiful Gradient Design */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='relative overflow-hidden rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 p-[2px]'
          >
            <div className='relative rounded-[10px] bg-linear-to-r from-emerald-50 to-cyan-50 px-4 py-3 dark:from-emerald-900/30 dark:to-cyan-900/30'>
              <div className='flex items-center justify-center gap-3'>
                {/* Animated Checkmark Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className='relative'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50'>
                    <svg className='h-5 w-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={3}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                  {/* Sparkle effect */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    className='absolute -top-1 -right-1 h-3 w-3 rounded-full bg-yellow-400'
                  />
                </motion.div>

                {/* Gradient Text */}
                <div className='text-center'>
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className='bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-lg font-bold text-transparent dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400'
                  >
                    {t('checkedIn')}
                  </motion.span>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className='mt-0.5 text-xs text-emerald-600/70 dark:text-emerald-400/70'
                  >
                    {t('comeBackTomorrow')}
                  </motion.p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className='absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-linear-to-bl from-cyan-200/30 to-transparent dark:from-cyan-400/10' />
              <div className='absolute bottom-0 left-0 h-16 w-16 rounded-tr-full bg-linear-to-tr from-emerald-200/30 to-transparent dark:from-emerald-400/10' />
            </div>
          </motion.div>
        )}

        {/* Toggle Calendar */}
        <Button
          animated={false}
          onClick={() => setShowCalendar(!showCalendar)}
          className='mt-3 flex w-full cursor-pointer items-center justify-center gap-1 py-2 text-sm text-gray-600 transition-colors hover:text-orange dark:text-gray-300 dark:hover:text-orange-400'
        >
          <svg
            className={classNames('h-4 w-4 transition-transform', showCalendar && 'rotate-180')}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
          {showCalendar ? t('hideCalendar') : t('showCalendar')}
        </Button>
      </div>

      {/* Calendar */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='overflow-hidden border-t border-gray-100 dark:border-slate-700'
          >
            <div className='p-4'>
              {/* Month Navigation */}
              <div className='mb-4 flex items-center justify-between'>
                <Button
                  animated={false}
                  onClick={goToPrevMonth}
                  className='cursor-pointer rounded-sm p-1 hover:bg-gray-100 dark:hover:bg-slate-700'
                  aria-label={t('prevMonth')}
                >
                  <svg className='h-5 w-5 dark:text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                </Button>
                <span className='font-medium dark:text-gray-200'>
                  {monthNames[currentMonth.month]} {currentMonth.year}
                </span>
                <Button
                  animated={false}
                  onClick={goToNextMonth}
                  className='cursor-pointer rounded-sm p-1 hover:bg-gray-100 dark:hover:bg-slate-700'
                  aria-label={t('nextMonth')}
                >
                  <svg className='h-5 w-5 dark:text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </Button>
              </div>

              {/* Day Names */}
              <div className='mb-2 grid grid-cols-7 gap-1'>
                {dayNames.map((day) => (
                  <div key={day} className='py-1 text-center text-xs font-medium text-gray-500 dark:text-slate-400'>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className='grid grid-cols-7 gap-1'>
                {/* Empty cells for days before first day of month */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className='aspect-square' />
                ))}
                {/* Calendar days */}
                {calendar.map((day) => {
                  const dayNum = parseInt(day.date.split('-')[2])
                  const isToday = day.date === new Date().toISOString().split('T')[0]
                  return (
                    <div
                      key={day.date}
                      className={classNames(
                        'relative flex aspect-square items-center justify-center rounded-full text-xs md:text-sm',
                        day.checked && 'bg-orange text-white',
                        isToday && !day.checked && 'ring-2 ring-orange',
                        !day.checked && !isToday && 'text-gray-600 dark:text-gray-300'
                      )}
                    >
                      {dayNum}
                      {day.checked && (
                        <svg
                          className='absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 p-0.5 text-white'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                        </svg>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default DailyCheckIn
