import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOptimisticNotification } from 'src/hooks/optimistic'
import { formatTimeAgo } from 'src/utils/utils'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { useIsMobile } from 'src/hooks/useIsMobile'
import { Notification, NotificationType } from 'src/types/notification.type'
import useNotifications from 'src/hooks/useNotifications'
import useNotificationSound from 'src/hooks/useNotificationSound'
import SEO from 'src/components/SEO'
import Button from 'src/components/Button'

type FilterTab = 'all' | 'order' | 'promotion' | 'system' | 'other'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'order', label: 'Đơn hàng' },
  { key: 'promotion', label: 'Khuyến mãi' },
  { key: 'system', label: 'Hệ thống' },
  { key: 'other', label: 'Khác' }
]

// Group notification types for filtering
const TYPE_GROUPS: Record<FilterTab, NotificationType[]> = {
  all: ['promotion', 'order', 'system', 'other'],
  order: ['order'],
  promotion: ['promotion'],
  system: ['system'],
  other: ['other']
}

const Notifications = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const { markAsReadMutation, markAllAsReadMutation } = useOptimisticNotification()
  const reducedMotion = useReducedMotion()
  const isMobile = useIsMobile()
  const listRef = useRef<HTMLUListElement>(null)

  // Unified notifications hook (REST + socket merged)
  const { notifications: allNotifications, unreadCount, isConnected, isLoading } = useNotifications()

  // Sound notification hook
  const { isMuted, toggleMute, playNotificationSound } = useNotificationSound()

  // Track new notification IDs for highlight animation
  const [newNotificationIds, setNewNotificationIds] = useState<Set<string>>(new Set())
  const prevNotificationCountRef = useRef(allNotifications.length)

  // Track if user has scrolled down (to show "new notification" banner)
  const [showNewBanner, setShowNewBanner] = useState(false)
  const [newBannerCount, setNewBannerCount] = useState(0)
  const bannerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle new notifications (detect when count increases)
  useEffect(() => {
    if (allNotifications.length > prevNotificationCountRef.current && prevNotificationCountRef.current > 0) {
      const latestNotification = allNotifications[0]

      // Add to highlight set
      setNewNotificationIds((prev) => new Set([...prev, latestNotification._id]))

      // Play sound
      playNotificationSound()

      // Check if user is scrolled down
      if (listRef.current && listRef.current.scrollTop > 100) {
        setShowNewBanner(true)
        setNewBannerCount((prev) => prev + 1)

        // Auto-dismiss banner after 5 seconds
        if (bannerTimeoutRef.current) {
          clearTimeout(bannerTimeoutRef.current)
        }
        bannerTimeoutRef.current = setTimeout(() => {
          setShowNewBanner(false)
          setNewBannerCount(0)
        }, 5000)
      }

      // Remove highlight after 2 seconds
      setTimeout(() => {
        setNewNotificationIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(latestNotification._id)
          return newSet
        })
      }, 2000)
    }
    prevNotificationCountRef.current = allNotifications.length
  }, [allNotifications, playNotificationSound])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current)
      }
    }
  }, [])

  // Handle banner click - scroll to top
  const handleBannerClick = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setShowNewBanner(false)
    setNewBannerCount(0)
  }, [])

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return allNotifications
    return allNotifications.filter((n) => TYPE_GROUPS[activeTab].includes(n.type))
  }, [allNotifications, activeTab])

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId)
    },
    [markAsReadMutation]
  )

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClasses = 'h-5 w-5'
    switch (type) {
      case 'order':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
            <svg className={`${iconClasses} text-green-600`} fill='currentColor' viewBox='0 0 20 20'>
              <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
            </svg>
          </div>
        )
      case 'promotion':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
            <svg className={`${iconClasses} text-red-600`} fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        )
      case 'system':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
            <svg className={`${iconClasses} text-blue-600`} fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        )
      default:
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
            <svg className={`${iconClasses} text-gray-600`} fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        )
    }
  }

  // Animation variants for stagger effect
  const containerVariants = isMobile
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05 }
        }
      }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className='rounded-lg bg-white p-4 shadow-sm md:p-6 dark:bg-slate-800'>
        <div className='mb-6 flex items-center justify-between'>
          <div className='h-8 w-32 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-600' />
          <div className='h-8 w-40 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-600' />
        </div>
        <div className='mb-6 scrollbar-hide flex gap-4 overflow-x-auto'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='h-8 w-20 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-600' />
          ))}
        </div>
        <div className='space-y-4'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='flex gap-3 rounded-lg border p-4 dark:border-slate-600'>
              <div className='h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-slate-600' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-3/4 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-600' />
                <div className='h-3 w-full animate-pulse rounded-sm bg-gray-200 dark:bg-slate-600' />
                <div className='h-3 w-1/4 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-600' />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className='rounded-lg bg-white p-4 shadow-sm md:p-6 dark:bg-slate-800'
      initial={reducedMotion ? undefined : { opacity: 0, y: 15 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <SEO title='Thông báo' noindex />
      {/* Header */}
      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <svg className='h-6 w-6 text-[#ee4d2d] dark:text-orange-400' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z' />
          </svg>
          <h1 className='text-xl font-semibold text-gray-800 dark:text-gray-100'>Thông báo</h1>
          {unreadCount > 0 && (
            <span className='rounded-full bg-[#ee4d2d] px-2 py-0.5 text-xs text-white'>{unreadCount}</span>
          )}
        </div>
        <div className='flex items-center gap-4'>
          {/* Real-time status indicator */}
          <div className='flex items-center gap-1.5'>
            <span
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
              aria-hidden='true'
            />
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              {isConnected ? 'Cập nhật thời gian thực' : 'Đang kết nối...'}
            </span>
          </div>

          {/* Sound toggle */}
          <Button
            variant='ghost'
            animated={false}
            type='button'
            onClick={toggleMute}
            className='flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700'
            aria-label={isMuted ? 'Bật âm thanh thông báo' : 'Tắt âm thanh thông báo'}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? (
              <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2'
                />
              </svg>
            ) : (
              <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z'
                />
              </svg>
            )}
          </Button>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <Button
              variant='text'
              animated={false}
              type='button'
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className='text-sm text-[#ee4d2d] hover:text-[#ee4d2d]/80 disabled:opacity-50 dark:text-orange-400 dark:hover:text-orange-400/80'
            >
              {markAllAsReadMutation.isPending ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className='mb-6 scrollbar-hide flex gap-1 overflow-x-auto border-b border-gray-200 pb-px md:gap-2 dark:border-slate-600'>
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant='text'
            animated={false}
            type='button'
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-[#ee4d2d] text-[#ee4d2d] dark:border-orange-400 dark:text-orange-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16'>
          <svg className='h-20 w-20 text-gray-300 dark:text-gray-600' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z' />
          </svg>
          <p className='mt-4 text-gray-500 dark:text-gray-400'>Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className='relative'>
          {/* New notification banner */}
          <AnimatePresence>
            {showNewBanner && (
              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: -20 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  animated={false}
                  type='button'
                  onClick={handleBannerClick}
                  className='absolute -top-2 left-1/2 z-10 -translate-x-1/2 cursor-pointer rounded-lg bg-[#ee4d2d] px-4 py-2 text-sm text-white shadow-lg'
                >
                  <span className='flex items-center gap-2'>
                    <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z'
                        clipRule='evenodd'
                      />
                    </svg>
                    Thông báo mới ({newBannerCount})
                  </span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.ul
            ref={listRef}
            className='max-h-[600px] space-y-3 overflow-y-auto'
            variants={reducedMotion ? undefined : containerVariants}
            initial={isMobile ? false : 'hidden'}
            animate={isMobile ? undefined : 'visible'}
          >
            {filteredNotifications.map((notification) => {
              const isNewNotification = newNotificationIds.has(notification._id)

              return (
                <motion.li
                  key={notification._id}
                  variants={reducedMotion ? undefined : itemVariants}
                  onClick={() =>
                    !notification.isRead && !markAsReadMutation.isPending && handleMarkAsRead(notification._id)
                  }
                  className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
                    !notification.isRead
                      ? 'border-l-2 border-l-[#ee4d2d] bg-[#fff5f5] dark:border-l-orange-400 dark:bg-orange-900/20'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700'
                  }`}
                  // Highlight animation for new notifications
                  initial={
                    isNewNotification && !reducedMotion ? { backgroundColor: 'rgba(238, 77, 45, 0.15)' } : undefined
                  }
                  animate={isNewNotification && !reducedMotion ? { backgroundColor: 'transparent' } : undefined}
                  transition={isNewNotification ? { duration: 2, ease: 'easeOut' } : undefined}
                  style={
                    isNewNotification && !reducedMotion ? { boxShadow: '0 0 0 2px rgba(238, 77, 45, 0.3)' } : undefined
                  }
                >
                  {/* Icon */}
                  <div className='shrink-0'>{getNotificationIcon(notification.type)}</div>

                  {/* Content */}
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-2'>
                      <h3
                        className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ee4d2d] dark:bg-orange-400' />
                      )}
                    </div>
                    <p className='mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400'>{notification.content}</p>
                    <p className='mt-2 text-xs text-gray-400'>{formatTimeAgo(notification.createdAt)}</p>
                  </div>
                </motion.li>
              )
            })}
          </motion.ul>
        </div>
      )}
    </motion.div>
  )
}

export default Notifications
