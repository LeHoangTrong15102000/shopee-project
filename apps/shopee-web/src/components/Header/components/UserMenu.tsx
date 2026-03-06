import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import Popover from 'src/components/Popover'
import { getAvatarUrl } from 'src/utils/utils'
import path from 'src/constant/path'
import classNames from 'classnames'
import Button from 'src/components/Button'

interface UserMenuProps {
  isAuthenticated: boolean
  profile: { avatar?: string; email?: string } | null
  onLogout: () => void
}

const UserMenu = ({ isAuthenticated, profile, onLogout }: UserMenuProps) => {
  const { t } = useTranslation('nav')
  return (
    <div className='flex shrink-0 items-center justify-end space-x-2 md:col-span-1 md:space-x-3'>
      {/* User Menu - Hiện trên mobile */}
      {isAuthenticated && (
        <Popover
          className='md:hidden'
          placement='bottom-end'
          renderPopover={
            <div className='relative rounded-xs border border-gray-200 bg-white shadow-md transition-all dark:border-slate-700 dark:bg-slate-800'>
              <div
                className={classNames(
                  'before:absolute before:top-0 before:right-4 before:h-[15px] before:w-full before:-translate-y-full before:bg-transparent before:content-[""]'
                )}
              >
                <Link
                  to={path.profile}
                  className='block w-full bg-white px-4 py-3 text-left text-sm text-gray-800 hover:bg-slate-100 hover:text-cyan-500 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
                >
                  {t('header.myAccount')}
                </Link>
                <Link
                  to={path.historyPurchases}
                  className='block w-full bg-white px-4 py-3 text-left text-sm text-gray-800 hover:bg-slate-100 hover:text-cyan-500 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
                >
                  {t('header.myOrders')}
                </Link>
                <Button
                  animated={false}
                  onClick={() => onLogout()}
                  className='block w-full bg-white px-4 py-3 text-left text-sm text-gray-800 hover:bg-slate-100 hover:text-cyan-500 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
                >
                  {t('header.logout')}
                </Button>
              </div>
            </div>
          }
        >
          <div className='flex cursor-pointer items-center'>
            <div className='h-7 w-7 shrink-0'>
              <img
                src={getAvatarUrl(profile?.avatar)}
                alt='avatar'
                className='h-full w-full rounded-full object-cover'
              />
            </div>
          </div>
        </Popover>
      )}

      {/* Login/Register - Hiện trên mobile khi chưa login */}
      {!isAuthenticated && (
        <div className='flex items-center text-xs md:hidden'>
          <Link to={path.login} className='hover:text-white/70'>
            {t('header.login')}
          </Link>
        </div>
      )}
    </div>
  )
}

export default UserMenu
