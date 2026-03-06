import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Notification, NotificationType } from 'src/types/notification.type'

interface Props {
  notification: Notification
  onMarkAsRead?: (id: string) => void
}

const NotificationItem = ({ notification, onMarkAsRead }: Props) => {
  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'promotion':
        return (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30'>
            <svg
              className='h-4 w-4 text-yellow-600 dark:text-yellow-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
              />
            </svg>
          </div>
        )
      case 'order':
        return (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
            <svg
              className='h-4 w-4 text-green-600 dark:text-green-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
              />
            </svg>
          </div>
        )
      case 'system':
        return (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
            <svg
              className='h-4 w-4 text-blue-600 dark:text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
        )
      case 'other':
      default:
        return (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700'>
            <svg
              className='h-4 w-4 text-gray-600 dark:text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
              />
            </svg>
          </div>
        )
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi })
    } catch {
      return dateString
    }
  }

  const handleClick = () => {
    if (onMarkAsRead) {
      onMarkAsRead(notification._id)
    }
  }

  return (
    <div
      onClick={handleClick}
      className='flex cursor-pointer items-start border-b border-gray-100 bg-blue-50 p-4 last:border-b-0 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-700/50 dark:hover:bg-slate-700'
    >
      <div className='mr-3 shrink-0'>{getTypeIcon(notification.type)}</div>

      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between'>
          <h4 className='line-clamp-1 text-sm font-semibold text-gray-900 dark:text-gray-100'>{notification.title}</h4>
          <div className='ml-2 h-2 w-2 shrink-0 rounded-full bg-orange'></div>
        </div>
        <p className='mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400'>{notification.content}</p>
        <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>{formatTime(notification.createdAt)}</p>
      </div>
    </div>
  )
}

export default NotificationItem
