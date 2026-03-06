import { Link } from 'react-router'
import Popover from 'src/components/Popover'
import NotificationItem from './NotificationItem'
import NotificationBadge from './NotificationBadge'
import useNotifications from 'src/hooks/useNotifications'
import path from 'src/constant/path'
import Button from 'src/components/Button'

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, clearAll, isConnected } = useNotifications()

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
  }

  const handleClearAll = () => {
    clearAll()
  }

  const renderNotifications = () => (
    <div className='relative max-w-[min(400px,calc(100vw-2rem))] rounded-xs border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-700'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-medium text-gray-900 dark:text-gray-100'>Thông báo mới nhận</h3>
          {/* Real-time connection indicator */}
          <span
            className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
            title={isConnected ? 'Đang kết nối thời gian thực' : 'Đang kết nối...'}
          />
        </div>
        {unreadCount > 0 && <span className='text-xs text-orange'>{unreadCount} thông báo mới</span>}
      </div>

      {/* Notification List */}
      <div className='max-h-[400px] overflow-y-auto'>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem key={notification._id} notification={notification} onMarkAsRead={handleMarkAsRead} />
          ))
        ) : (
          <div className='flex flex-col items-center justify-center px-4 py-8'>
            <svg
              className='mb-2 h-12 w-12 text-gray-300 dark:text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M15 17h5l-5-5 5-5h-5m-6 10h5l-5-5 5-5H9'
              />
            </svg>
            <p className='text-center text-sm text-gray-500 dark:text-gray-400'>Chưa có thông báo nào</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className='flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-slate-700'>
          <Link to={path.notifications} className='text-sm text-orange hover:text-[#d73527]'>
            Xem tất cả thông báo
          </Link>
          <Button
            variant='text'
            animated={false}
            onClick={handleClearAll}
            className='text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          >
            Đánh dấu đã đọc tất cả
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <Popover className='relative' renderPopover={renderNotifications()} placement='bottom-end'>
      <Button
        variant='icon'
        animated={false}
        className='relative flex items-center justify-center text-white transition-colors hover:text-white/80'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='h-6 w-6'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
          />
        </svg>
        <NotificationBadge count={unreadCount} />
      </Button>
    </Popover>
  )
}

export default NotificationDropdown
