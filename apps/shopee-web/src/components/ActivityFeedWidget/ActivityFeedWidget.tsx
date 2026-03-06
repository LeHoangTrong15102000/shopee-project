import classNames from 'classnames'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface ActivityItem {
  type: 'purchase' | 'review'
  message: string
  timestamp: string
}

interface ActivityFeedWidgetProps {
  latestActivity: ActivityItem | null
  className?: string
}

const MAX_QUEUE_SIZE = 20
const DISPLAY_DURATION = 5000

export default function ActivityFeedWidget({ latestActivity, className }: ActivityFeedWidgetProps) {
  const { t } = useTranslation('common')
  const [visible, setVisible] = useState(false)
  const [currentActivity, setCurrentActivity] = useState<ActivityItem | null>(null)
  const queueRef = useRef<ActivityItem[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isShowingRef = useRef(false)
  const lastActivityRef = useRef<ActivityItem | null>(null)

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      setVisible(false)
      setCurrentActivity(null)
      isShowingRef.current = false
      return
    }

    const next = queueRef.current.shift()!
    setCurrentActivity(next)
    setVisible(true)
    isShowingRef.current = true

    timerRef.current = setTimeout(() => {
      showNext()
    }, DISPLAY_DURATION)
  }, [])

  // Queue new activities when they arrive
  useEffect(() => {
    if (!latestActivity || latestActivity === lastActivityRef.current) return
    lastActivityRef.current = latestActivity

    // Add to queue, cap at MAX_QUEUE_SIZE
    queueRef.current.push(latestActivity)
    if (queueRef.current.length > MAX_QUEUE_SIZE) {
      queueRef.current.shift() // Drop oldest
    }

    // If not currently showing, start showing
    if (!isShowingRef.current) {
      showNext()
    }
  }, [latestActivity, showNext])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  if (!visible || !currentActivity) {
    return null
  }

  const timeAgo = (() => {
    const diff = Math.floor((Date.now() - new Date(currentActivity.timestamp).getTime()) / 1000)
    if (diff < 60) return t('time.justNow')
    if (diff < 3600) return t('time.minutesAgo', { count: Math.floor(diff / 60) })
    return t('time.hoursAgo', { count: Math.floor(diff / 3600) })
  })()

  return (
    <div
      className={classNames(
        'flex animate-fade-in items-center gap-2 rounded-lg border border-gray-100 bg-white px-2 py-1.5 text-xs shadow-md sm:px-3 sm:py-2 sm:text-sm dark:border-slate-700 dark:bg-slate-800',
        className
      )}
    >
      <span className='text-base sm:text-lg'>{currentActivity.type === 'purchase' ? '🛒' : '⭐'}</span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-gray-700 dark:text-gray-200'>{currentActivity.message}</p>
        <p className='text-[10px] text-gray-400 sm:text-xs dark:text-gray-500'>{timeAgo}</p>
      </div>
    </div>
  )
}
