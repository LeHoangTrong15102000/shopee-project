import InventoryAlertBadge from 'src/components/InventoryAlertBadge'
import ThemeToggle from 'src/components/ThemeToggle'
import Popover from '../../Popover'
import Button from 'src/components/Button'
import NotificationPopover from './NotificationPopover'
import { InventoryAlertPayload } from 'src/types/socket.types'
import { NotificationResponse } from 'src/types/notification.type'
import { User } from 'src/types/user.type'

interface NavHeaderCompactProps {
  isAuthenticated: boolean
  isAdmin: boolean
  inventoryAlerts: InventoryAlertPayload[]
  inventoryUnreadCount: number
  clearInventoryAlerts: () => void
  unreadCount: number
  handleTranslateLanguage: (lng: 'en' | 'vi') => Promise<void>
  notificationsData?: { data: NotificationResponse }
  profile: User | null
}

const NavHeaderCompact = ({
  isAuthenticated,
  isAdmin,
  inventoryAlerts,
  inventoryUnreadCount,
  clearInventoryAlerts,
  unreadCount,
  handleTranslateLanguage
}: NavHeaderCompactProps) => {
  return (
    <div className='flex items-center gap-1 sm:gap-3'>
      <ThemeToggle className='' />
      {isAdmin && isAuthenticated && (
        <InventoryAlertBadge
          alerts={inventoryAlerts}
          unreadCount={inventoryUnreadCount}
          onClear={clearInventoryAlerts}
          className='cursor-pointer'
        />
      )}
      {/* Notification bell */}
      <Popover
        as='span'
        className='relative flex cursor-pointer items-center py-1 hover:text-white/70'
        renderPopover={<NotificationPopover isAuthenticated={isAuthenticated} variant='compact' />}
      >
        <div className='relative'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className={`h-5 w-5 transition-transform duration-200 ${
              isAuthenticated && unreadCount > 0 ? 'animate-[bell-shake_1s_ease-in-out_infinite]' : ''
            }`}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
            />
          </svg>
          {isAuthenticated && unreadCount > 0 && (
            <span className='absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-orange bg-white text-[10px] font-medium text-orange'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </Popover>
      {/* Language switcher - icon only */}
      <Popover
        as='span'
        className='flex cursor-pointer items-center py-1 hover:text-white/70'
        renderPopover={
          <div className='relative rounded-lg border border-gray-200 bg-white shadow-md transition-all dark:border-slate-700 dark:bg-slate-800'>
            <div className='flex flex-col py-1 before:absolute before:top-0 before:left-0 before:h-[13px] before:w-full before:-translate-y-full before:bg-transparent before:content-[""]'>
              <Button
                animated={false}
                onClick={() => handleTranslateLanguage('vi')}
                className='block w-full px-6 py-3 text-left text-xs text-gray-900 hover:bg-slate-100 hover:text-cyan-500 dark:text-gray-100 dark:hover:bg-slate-700 dark:hover:text-cyan-400'
              >
                Tiếng Việt
              </Button>
              <Button
                animated={false}
                onClick={() => handleTranslateLanguage('en')}
                className='block w-full px-6 py-3 text-left text-xs text-gray-900 hover:bg-slate-100 hover:text-cyan-500 dark:text-gray-100 dark:hover:bg-slate-700 dark:hover:text-cyan-400'
              >
                English
              </Button>
            </div>
          </div>
        }
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='h-5 w-5'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418'
          />
        </svg>
      </Popover>
    </div>
  )
}

export default NavHeaderCompact
