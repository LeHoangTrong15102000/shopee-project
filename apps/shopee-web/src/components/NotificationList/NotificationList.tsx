import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'src/components/Button'
import { useOptimisticNotification } from 'src/hooks/optimistic'
import { useKeyboardNavigation } from 'src/hooks/useKeyboardNavigation'
import useNotifications from 'src/hooks/useNotifications'
import { formatTimeAgo } from 'src/utils/utils'

interface NotificationListProps {
  className?: string
}

const NotificationList = ({ className }: NotificationListProps) => {
  const { t } = useTranslation('notification')
  const { markAsReadMutation, markAllAsReadMutation } = useOptimisticNotification()
  const { notifications, unreadCount, isLoading } = useNotifications()

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId)
    },
    [markAsReadMutation]
  )

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const handleNotificationKeyDown = useCallback(
    (e: React.KeyboardEvent, notificationId: string, isRead: boolean) => {
      if ((e.key === 'Enter' || e.key === ' ') && !isRead && !markAsReadMutation.isPending) {
        e.preventDefault()
        handleMarkAsRead(notificationId)
      }
    },
    [handleMarkAsRead, markAsReadMutation.isPending]
  )

  const { handleKeyDown: handleMarkAllKeyDown } = useKeyboardNavigation({
    onEnter: handleMarkAllAsRead,
    enabled: unreadCount > 0 && !markAllAsReadMutation.isPending
  })

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'order':
        return t('types.order')
      case 'promotion':
        return t('types.promotion')
      case 'system':
        return t('types.system')
      default:
        return t('types.other')
    }
  }

  if (isLoading) {
    return (
      <div
        role='status'
        aria-busy='true'
        aria-label={t('loading')}
        className={`relative max-w-[calc(100vw-2rem)] rounded-xs border border-gray-200 bg-white text-sm shadow-md before:absolute before:top-0 before:left-0 before:h-[15px] before:w-full before:-translate-y-full before:bg-transparent before:content-[""] sm:max-w-[400px] dark:border-slate-700 dark:bg-slate-800 ${className}`}
      >
        <div className='flex h-[250px] w-full items-center justify-center'>
          <div className='text-sm text-gray-500 dark:text-gray-400'>{t('loading')}</div>
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div
        role='region'
        aria-label={t('noNotifications')}
        className={`relative max-w-[calc(100vw-2rem)] rounded-xs border border-gray-200 bg-white text-sm shadow-md before:absolute before:top-0 before:left-0 before:h-[15px] before:w-full before:-translate-y-full before:bg-transparent before:content-[""] sm:max-w-[400px] dark:border-slate-700 dark:bg-slate-800 ${className}`}
      >
        <div className='flex h-[250px] w-full flex-col items-center justify-center p-2'>
          <svg
            className='h-16 w-16 text-gray-300 dark:text-gray-600'
            fill='currentColor'
            viewBox='0 0 20 20'
            aria-hidden='true'
          >
            <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z' />
          </svg>
          <span className='mt-2 text-sm text-gray-500 dark:text-gray-400'>{t('noNotifications')}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      role='region'
      aria-label={t('listLabel')}
      className={`relative max-w-[calc(100vw-2rem)] rounded-xs border border-gray-200 bg-white text-sm shadow-md before:absolute before:top-0 before:left-0 before:h-[15px] before:w-full before:-translate-y-full before:bg-transparent before:content-[""] sm:max-w-[400px] dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      <div className='py-[10px] pr-[15px] pl-[10px]'>
        <div className='flex items-center justify-between'>
          <div className='text-[rgba(0,0,0,.26)] capitalize dark:text-gray-400'>{t('newNotifications')}</div>
          <span aria-live='polite' aria-atomic='true' className='sr-only'>
            {unreadCount > 0 ? t('unreadCount', { count: unreadCount }) : t('noUnread')}
          </span>
          {unreadCount > 0 && (
            <span className='rounded-full bg-orange px-2 py-0.5 text-xs text-white' aria-hidden='true'>
              {unreadCount}
            </span>
          )}
        </div>

        {/* Notification List */}
        <ul role='list' aria-label={t('listLabel')} className='mt-5 max-h-[300px] overflow-x-hidden overflow-y-auto'>
          {notifications.map((notification, _index) => (
            <li
              key={notification._id}
              role='listitem'
              tabIndex={0}
              aria-label={`${getNotificationTypeLabel(notification.type)}: ${notification.title}. ${notification.isRead ? t('read') : t('unread')}. ${formatTimeAgo(notification.createdAt)}`}
              className={`mt-2 flex animate-fade-in cursor-pointer py-2 pr-2 transition-colors duration-200 hover:bg-gray-100 hover:shadow-xs focus:ring-2 focus:ring-orange focus:outline-hidden focus:ring-inset dark:hover:bg-slate-700 ${
                !notification.isRead ? 'border-l-2 border-orange bg-[#fff5f5] dark:bg-slate-700/50' : ''
              }`}
              onClick={() =>
                !notification.isRead && !markAsReadMutation.isPending && handleMarkAsRead(notification._id)
              }
              onKeyDown={(e) => handleNotificationKeyDown(e, notification._id, notification.isRead)}
            >
              {/* Icon */}
              <div className='shrink-0' aria-hidden='true'>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    notification.type === 'order'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : notification.type === 'promotion'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : notification.type === 'system'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-gray-100 dark:bg-slate-700'
                  }`}
                >
                  {notification.type === 'order' && (
                    <svg className='h-5 w-5 text-green-600 dark:text-green-400' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                    </svg>
                  )}
                  {notification.type === 'promotion' && (
                    <svg className='h-5 w-5 text-red-600 dark:text-red-400' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z'
                        clipRule='evenodd'
                      />
                    </svg>
                  )}
                  {notification.type === 'system' && (
                    <svg className='h-5 w-5 text-blue-600 dark:text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                        clipRule='evenodd'
                      />
                    </svg>
                  )}
                  {notification.type === 'other' && (
                    <svg className='h-5 w-5 text-gray-600 dark:text-gray-400' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                        clipRule='evenodd'
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className='ml-2 grow overflow-hidden'>
                <div className='flex items-start justify-between'>
                  <div
                    className={`truncate text-sm ${!notification.isRead ? 'font-medium text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {notification.title}
                  </div>
                  {!notification.isRead && (
                    <div className='ml-2 h-2 w-2 shrink-0 rounded-full bg-orange' aria-hidden='true'></div>
                  )}
                </div>
                <div className='mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400'>{notification.content}</div>
                <div className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
                  {formatTimeAgo(notification.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className='mt-6 flex items-center justify-between text-gray-500 dark:text-gray-400'>
          <div className='text-xs capitalize'>
            {unreadCount > 0 ? (
              <Button
                type='button'
                onClick={handleMarkAllAsRead}
                onKeyDown={(e) => handleMarkAllKeyDown(e as unknown as KeyboardEvent)}
                disabled={markAllAsReadMutation.isPending}
                aria-label={t('markAllReadLabel', { count: unreadCount })}
                aria-busy={markAllAsReadMutation.isPending}
                variant='text'
                animated={false}
                className='text-orange transition-colors hover:text-orange/80 focus:underline focus:outline-hidden disabled:opacity-50 dark:hover:text-orange-400/80'
                title={t('markAllRead')}
              >
                {markAllAsReadMutation.isPending ? t('processing') : t('markAllRead')}
              </Button>
            ) : (
              <span className='text-green-600 dark:text-green-400' role='status'>
                ✓ {t('allRead')}
              </span>
            )}
          </div>
          <Button
            type='button'
            aria-label={t('viewAll')}
            animated={false}
            className='hover:bg-opacity-90 rounded-xs bg-orange px-4 py-2 text-xs text-white capitalize focus:ring-2 focus:ring-orange focus:ring-offset-2 focus:outline-hidden'
          >
            {t('viewAll')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotificationList
