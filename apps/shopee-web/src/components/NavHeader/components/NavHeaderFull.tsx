import classNames from 'classnames'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import path from 'src/constant/path'
import InventoryAlertBadge from 'src/components/InventoryAlertBadge'
import ThemeToggle from 'src/components/ThemeToggle'
import Popover from '../../Popover'
import Button from 'src/components/Button'
import NotificationPopover from './NotificationPopover'
import AppDownloadPopover from './AppDownloadPopover'
import { InventoryAlertPayload } from 'src/types/socket.types'
import { User } from 'src/types/user.type'
import { getAvatarUrl } from 'src/utils/utils'

interface NavHeaderFullProps {
  isAuthenticated: boolean
  isAdmin: boolean
  inventoryAlerts: InventoryAlertPayload[]
  inventoryUnreadCount: number
  clearInventoryAlerts: () => void
  unreadCount: number
  handleTranslateLanguage: (lng: 'en' | 'vi') => Promise<void>
  currentLanguage: string
  profile: User | null
  handleLogout: () => void
}

const NavHeaderFull = ({
  isAuthenticated,
  isAdmin,
  inventoryAlerts,
  inventoryUnreadCount,
  clearInventoryAlerts,
  unreadCount,
  handleTranslateLanguage,
  currentLanguage,
  profile,
  handleLogout
}: NavHeaderFullProps) => {
  return (
    <div className='flex items-center justify-end md:justify-between'>
      {/* Tải ứng dụng, Social kết nối, kênh người bán - Ẩn trên mobile */}
      {isAuthenticated ? <AuthenticatedLeftSection /> : <UnauthenticatedLeftSection />}
      {/* Thông báo, hỗ trợ, thông tin tài khoản */}
      <div className='flex items-center justify-end gap-2 sm:gap-1 md:gap-0'>
        <ThemeToggle className='md:mr-3' />
        {isAdmin && isAuthenticated && (
          <InventoryAlertBadge
            alerts={inventoryAlerts}
            unreadCount={inventoryUnreadCount}
            onClear={clearInventoryAlerts}
            className='cursor-pointer md:mr-3'
          />
        )}
        <NotificationBell isAuthenticated={isAuthenticated} unreadCount={unreadCount} />
        <SupportLink />
        <LanguagePopover handleTranslateLanguage={handleTranslateLanguage} currentLanguage={currentLanguage} />
        {isAuthenticated && <UserMenu profile={profile} handleLogout={handleLogout} />}
        {!isAuthenticated && <AuthLinks />}
      </div>
    </div>
  )
}

const AuthenticatedLeftSection = () => {
  const { t } = useTranslation('nav')
  return (
    <div className='hidden items-center justify-center md:flex'>
      <Link to='https://banhang.shopee.vn/' className='ml-2 hidden lg:block'>
        <div className='mr-3 flex cursor-pointer items-center py-1 hover:text-white/70'>
          <span className='mx-1 text-sm capitalize'>{t('header.sellerChannel')}</span>
        </div>
      </Link>
      <div className='hidden h-4 border-r border-r-white/40 lg:block'></div>
      <Popover
        as='span'
        enableArrow={false}
        placement='bottom-start'
        className='mx-2 flex hidden cursor-pointer items-center py-1 hover:text-white/70 lg:flex'
        renderPopover={<AppDownloadPopover />}
      >
        <span className='mx-1 text-sm capitalize'>{t('header.downloadApp')}</span>
      </Popover>
      <div className='hidden h-4 border-r border-r-white/40 lg:block'></div>
      <div className='ml-2 flex hidden items-center py-1 hover:text-white/70 lg:flex'>
        <span className='mx-1 text-sm capitalize'>{t('header.connect')}</span>
      </div>
      <SocialLinks />
    </div>
  )
}

const UnauthenticatedLeftSection = () => {
  const { t } = useTranslation('nav')
  return (
    <div className='hidden items-center justify-center md:flex'>
      <Link to='https://banhang.shopee.vn/' className='mr-2 ml-2 hidden lg:block'>
        <div className='flex cursor-pointer items-center py-1 hover:text-white/70'>
          <span className='mx-1 text-sm capitalize'>{t('header.sellerChannel')}</span>
        </div>
      </Link>
      <div className='hidden h-4 border-r border-r-white/40 lg:block'></div>
      <Link to='https://shopee.vn/seller/signup' className='mr-2 ml-1 hidden lg:block'>
        <div className='flex cursor-pointer items-center py-1 hover:text-white/70'>
          <span className='mx-1 text-sm capitalize'>{t('header.becomeSeller')}</span>
        </div>
      </Link>
      <div className='hidden h-4 border-r border-r-white/40 lg:block'></div>
      <Popover
        as='span'
        enableArrow={false}
        placement='bottom-start'
        className='mx-2 flex hidden cursor-pointer items-center py-1 hover:text-white/70 lg:flex'
        renderPopover={<AppDownloadPopover />}
      >
        <span className='mx-1 text-sm capitalize'>{t('header.downloadApp')}</span>
      </Popover>
      <div className='hidden h-4 border-r border-r-white/40 lg:block'></div>
      <div className='ml-2 flex hidden items-center py-1 hover:text-white/70 lg:flex'>
        <span className='mx-1 text-sm capitalize'>{t('header.connect')}</span>
      </div>
      <SocialLinks />
    </div>
  )
}

const SocialLinks = () => (
  <div className='flex hidden items-center justify-center lg:flex'>
    <Link
      to='https://www.facebook.com/ShopeeVN'
      className='mr-2 h-[16px] w-[16px] overflow-hidden text-center indent-[-9999px]'
    >
      <div
        style={{
          backgroundImage:
            'url(https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/cab134ca96b0829b591cfaff892ae62c.png)',
          backgroundSize: '487.5% 293.75%',
          backgroundPosition: '8.064516129032258% 16.129032258064516%',
          width: '16px',
          height: '16px'
        }}
      ></div>
    </Link>
    <Link to='https://instagram.com/Shopee_VN' className='mr-2 overflow-hidden text-center indent-[-9999px]'>
      <div
        style={{
          backgroundImage:
            'url(https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/cab134ca96b0829b591cfaff892ae62c.png)',
          backgroundSize: '487.5% 293.75%',
          backgroundPosition: '58.064516129032256% 16.129032258064516%',
          width: '16px',
          height: '16px'
        }}
      ></div>
    </Link>
  </div>
)

interface NotificationBellProps {
  isAuthenticated: boolean
  unreadCount: number
}

const NotificationBell = ({ isAuthenticated, unreadCount }: NotificationBellProps) => {
  const { t } = useTranslation('nav')
  return (
    <Popover
      as='span'
      className={classNames('relative flex cursor-pointer items-center py-1 hover:text-white/70')}
      renderPopover={<NotificationPopover isAuthenticated={isAuthenticated} variant='full' />}
    >
      <div className='relative'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className={`h-5 w-5 transition-transform duration-200 md:h-[22px] md:w-[22px] ${
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
          <span className='absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-orange bg-white text-[10px] font-medium text-orange md:text-xs'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      <span className='mx-1 hidden text-xs capitalize md:inline md:text-sm'>{t('header.notification')}</span>
    </Popover>
  )
}

const SupportLink = () => {
  const { t } = useTranslation('nav')
  return (
    <Link to={path.login} className='mt-px hidden md:block'>
      <div className='mr-3 flex cursor-pointer items-center py-1 hover:text-white/70'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='h-5 w-5 md:h-[22px] md:w-[22px]'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z'
          />
        </svg>
        <span className='mx-1 text-sm capitalize'>{t('header.support')}</span>
      </div>
    </Link>
  )
}

interface LanguagePopoverProps {
  handleTranslateLanguage: (lng: 'en' | 'vi') => Promise<void>
  currentLanguage: string
}

const LanguagePopover = ({ handleTranslateLanguage, currentLanguage }: LanguagePopoverProps) => (
  <Popover
    as='span'
    className={classNames('flex cursor-pointer items-center py-1 hover:text-white/70')}
    renderPopover={
      <div className='relative rounded-lg border border-gray-200 bg-white shadow-md transition-all dark:border-slate-700 dark:bg-slate-800'>
        <div
          className={classNames(
            'flex flex-col py-1 before:absolute before:top-0 before:left-0 before:h-[13px] before:w-full before:-translate-y-full before:bg-transparent before:content-[""]'
          )}
        >
          <Button
            animated={false}
            onClick={() => handleTranslateLanguage('vi')}
            className='block w-full px-8 py-3 text-left text-xs text-gray-900 hover:bg-slate-100 hover:text-cyan-500 md:text-sm dark:text-gray-100 dark:hover:bg-slate-700 dark:hover:text-cyan-400'
          >
            Tiếng Việt
          </Button>
          <Button
            animated={false}
            onClick={() => handleTranslateLanguage('en')}
            className='block w-full px-8 py-3 text-left text-xs text-gray-900 hover:bg-slate-100 hover:text-cyan-500 md:text-sm dark:text-gray-100 dark:hover:bg-slate-700 dark:hover:text-cyan-400'
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
    <span className='mx-1 hidden text-xs md:inline md:text-sm'>{currentLanguage}</span>
    <svg
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
      className='hidden h-5 w-5 md:block'
    >
      <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
    </svg>
  </Popover>
)

interface UserMenuProps {
  profile: User | null
  handleLogout: () => void
}

const UserMenu = ({ profile, handleLogout }: UserMenuProps) => {
  const { t } = useTranslation('nav')
  return (
    <Popover
      as='span'
      placement='bottom-start'
      renderPopover={
        <div className='relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-all dark:border-slate-700 dark:bg-slate-800'>
          <div
            className={classNames(
              'before:absolute before:top-0 before:left-0 before:h-[15px] before:w-full before:-translate-y-full before:bg-transparent before:content-[""]'
            )}
          >
            <Link
              to={path.profile}
              className='block w-full rounded-t-lg bg-white px-4 py-3 text-left text-xs hover:bg-slate-100 hover:text-cyan-500 md:text-sm dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 dark:hover:text-cyan-400'
            >
              {t('header.myAccount')}
            </Link>
            <Link
              to={path.historyPurchases}
              className='block w-full bg-white px-4 py-3 text-left text-xs hover:bg-slate-100 hover:text-cyan-500 md:text-sm dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 dark:hover:text-cyan-400'
            >
              {t('header.myOrders')}
            </Link>
            <Button
              animated={false}
              onClick={() => handleLogout()}
              className='block w-full rounded-b-lg bg-white px-4 py-3 text-left text-xs hover:bg-slate-100 hover:text-cyan-500 md:text-sm dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 dark:hover:text-cyan-400'
            >
              {t('header.logout')}
            </Button>
          </div>
        </div>
      }
      className={classNames('ml-2 flex cursor-pointer items-center py-1 hover:text-white/70 md:ml-5')}
    >
      <div className='h-6 w-6 shrink-0 md:mr-2 md:h-7 md:w-7'>
        <img src={getAvatarUrl(profile?.avatar)} alt='avatar' className='h-full w-full rounded-full object-cover' />
      </div>
      <span className='hidden max-w-none truncate text-sm md:inline'>{profile?.email}</span>
    </Popover>
  )
}

const AuthLinks = () => {
  const { t } = useTranslation('nav')
  return (
    <div className='mt-[1.5px] flex items-center text-xs md:text-sm'>
      <Link to={path.register} className='mx-2 capitalize hover:text-white/70 md:mx-3'>
        {t('header.register')}
      </Link>
      <div className='h-4 border-r border-r-white/40'></div>
      <Link to={path.login} className='mx-2 capitalize hover:text-white/70 md:mx-3'>
        {t('header.login')}
      </Link>
    </div>
  )
}

export default NavHeaderFull
