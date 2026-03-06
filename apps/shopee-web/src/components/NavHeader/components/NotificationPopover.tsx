import classNames from 'classnames'
import { Link } from 'react-router'
import path from 'src/constant/path'
import NotificationList from '../../NotificationList'

interface NotificationPopoverProps {
  isAuthenticated: boolean
  variant?: 'compact' | 'full'
}

const NotificationPopover = ({ isAuthenticated, variant = 'full' }: NotificationPopoverProps) => {
  if (isAuthenticated) {
    return (
      <div className='before:absolute before:top-0 before:left-0 before:h-[15px] before:w-full before:-translate-y-full before:bg-transparent before:content-[""]'>
        <NotificationList />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className='relative h-87.5 w-[280px] cursor-pointer rounded-lg border border-gray-200 bg-white text-sm text-[rgba(0,0,0,.7)] shadow-md transition-all'>
        <div className='flex h-full flex-col before:absolute before:top-0 before:left-0 before:h-[15px] before:w-full before:-translate-y-full before:bg-transparent before:content-[""]'>
          <div className='flex grow flex-col items-center justify-center'>
            <img
              className='h-20 w-20 object-cover'
              src='https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/99e561e3944805a023e87a81d4869600.png'
              alt='notification'
            />
            <span className='mt-5 text-xs'>Đăng nhập để xem Thông báo</span>
          </div>
          <div className='flex w-full items-center border-0'>
            <Link
              to={path.register}
              className='h-10 w-[50%] bg-[rgba(0,0,0,0.04)] p-2 text-center text-xs hover:text-orange dark:hover:text-orange-400'
            >
              Đăng ký
            </Link>
            <Link
              to={path.login}
              className='h-10 w-[50%] bg-[rgba(0,0,0,0.04)] p-2 text-center text-xs hover:text-orange dark:hover:text-orange-400'
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='relative h-87.5 w-[300px] cursor-pointer rounded-lg border border-gray-200 bg-white text-sm text-[rgba(0,0,0,.7)] shadow-md transition-all md:w-[400px]'>
      <div
        className={classNames(
          'flex h-full flex-col before:absolute before:top-0 before:left-0 before:h-[15px] before:w-full before:-translate-y-full before:bg-transparent before:content-[""]'
        )}
      >
        <div className='flex grow flex-col items-center justify-center'>
          <div className='flex items-center'>
            <img
              className='h-20 w-20 object-cover md:h-25 md:w-25'
              src='https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/99e561e3944805a023e87a81d4869600.png'
              alt='anh'
            />
          </div>
          <span className='mt-5 text-xs md:text-sm'>Đăng nhập để xem Thông báo</span>
        </div>
        <div className='flex w-full items-center border-0'>
          <Link
            to={path.register}
            className='h-10 w-[50%] bg-[rgba(0,0,0,0.04)] p-2 text-center text-xs hover:text-orange md:text-sm dark:hover:text-orange-400'
          >
            Đăng ký
          </Link>
          <Link
            to={path.login}
            className='h-10 w-[50%] bg-[rgba(0,0,0,0.04)] p-2 text-center text-xs hover:text-orange md:text-sm dark:hover:text-orange-400'
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotificationPopover
