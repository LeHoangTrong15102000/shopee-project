import classNames from 'classnames'
import { motion } from 'framer-motion'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router'
import path from 'src/constant/path'
import MobileAccountNav from 'src/components/MobileAccountNav'
import { AppContext } from 'src/contexts/app.context'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { getAvatarUrl } from 'src/utils/utils'

const UserSideNav = () => {
  const { t } = useTranslation('user')
  const { profile } = useContext(AppContext)
  const reducedMotion = useReducedMotion()

  return (
    <div>
      {/* Mobile horizontal icon+label tab bar */}
      <MobileAccountNav className='mb-0' />

      {/* Desktop sidebar - hidden on mobile */}
      <div className='hidden md:block'>
        {/* Avatar */}
        <div className='flex items-center border-b border-b-gray-200 py-4 dark:border-b-slate-700'>
          {/* Avatar */}
          <Link
            to={path.profile}
            className='h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-slate-600'
          >
            <img
              // src='https://down-vn.img.susercontent.com/file/b34a1e6b65aaa8ba6474c7886dc59df2_tn'
              src={getAvatarUrl(profile?.avatar)}
              alt='avatar_profile'
              className='h-full w-full object-cover'
            />
          </Link>
          {/* Tên user, mục: sửa hồ sơ */}
          <div className='grow pl-[14px]'>
            <div className='mb-1 truncate font-semibold text-gray-600 dark:text-gray-300'>{profile?.name}</div>
            <Link to={path.profile} className='flex items-center bg-transparent capitalize'>
              {/* Icon */}
              <svg
                width={12}
                height={12}
                viewBox='0 0 12 12'
                xmlns='http://www.w3.org/2000/svg'
                className='mr-1 text-gray-400 dark:text-gray-500'
              >
                <path
                  d='M8.54 0L6.987 1.56l3.46 3.48L12 3.48M0 8.52l.073 3.428L3.46 12l6.21-6.18-3.46-3.48'
                  fill='currentColor'
                  fillRule='evenodd'
                />
              </svg>
              {/* Title Sửa hồ sơ */}
              <span className='text-[#888] capitalize dark:text-gray-400'>{t('sideNav.editProfile')}</span>
            </Link>
          </div>
        </div>
        {/* Link chứa profile, password, historyPurchases */}
        <div className='mt-7 ml-2'>
          {/* Sale 4.4 */}
          <Link to={path.profile} className='mb-3.75 flex items-center justify-start capitalize transition-colors'>
            <div className='mr-2 flex shrink-0 items-center justify-center rounded-sm'>
              <img
                src='https://down-vn.img.susercontent.com/file/sg-11134004-7qvfe-lezlew2dqrn784'
                alt='Avatar'
                className='h-6 w-6'
              />
            </div>
            <span className='relative flex items-center leading-tight font-medium capitalize'>
              <span>Ngày 15 sale giữa tháng</span>
              {/* <span className='ml-2 rounded-tl-2xl rounded-tr-3xl rounded-br-3xl bg-[#ee4d2d] p-1 text-[9px] text-white'>
              New
            </span> */}
              <span className='absolute top-[17px] left-[43px]'>
                <svg width='32' height='18' viewBox='0 0 32 18' fill='none'>
                  <path
                    d='M1 9C1 4.58172 4.58172 1 9 1H23C27.4183 1 31 4.58172 31 9C31 13.4183 27.4183 17 23 17H1V9Z'
                    fill='#EE4D2D'
                  ></path>
                  <path
                    d='M12.4111 12H11.1758L8.00684 6.95605V12H6.77148V4.89062H8.00684L11.1855 9.9541V4.89062H12.4111V12ZM16.083 12.0977C15.3311 12.0977 14.7207 11.8617 14.252 11.3896C13.7865 10.9144 13.5537 10.2829 13.5537 9.49512V9.34863C13.5537 8.82129 13.6546 8.35091 13.8564 7.9375C14.0615 7.52083 14.348 7.19694 14.7158 6.96582C15.0837 6.7347 15.4938 6.61914 15.9463 6.61914C16.6657 6.61914 17.2207 6.84863 17.6113 7.30762C18.0052 7.7666 18.2021 8.41602 18.2021 9.25586V9.73438H14.75C14.7858 10.1706 14.9307 10.5156 15.1846 10.7695C15.4417 11.0234 15.764 11.1504 16.1514 11.1504C16.695 11.1504 17.1377 10.9307 17.4795 10.4912L18.1191 11.1016C17.9076 11.4173 17.6243 11.6631 17.2695 11.8389C16.918 12.0114 16.5225 12.0977 16.083 12.0977ZM15.9414 7.57129C15.6159 7.57129 15.3522 7.68522 15.1504 7.91309C14.9518 8.14095 14.8249 8.45833 14.7695 8.86523H17.0303V8.77734C17.0042 8.38021 16.8984 8.08073 16.7129 7.87891C16.5273 7.67383 16.2702 7.57129 15.9414 7.57129ZM23.7686 10.3643L24.6084 6.7168H25.7656L24.3252 12H23.3486L22.2158 8.37207L21.1025 12H20.126L18.6807 6.7168H19.8379L20.6924 10.3252L21.7764 6.7168H22.6699L23.7686 10.3643Z'
                    fill='white'
                  ></path>
                  <path
                    d='M1 17H0V18H1V17ZM9 2H23V0H9V2ZM23 16H1V18H23V16ZM2 17V9H0V17H2ZM30 9C30 12.866 26.866 16 23 16V18C27.9706 18 32 13.9706 32 9H30ZM23 2C26.866 2 30 5.13401 30 9H32C32 4.02944 27.9706 0 23 0V2ZM9 0C4.02944 0 0 4.02944 0 9H2C2 5.13401 5.13401 2 9 2V0Z'
                    fill='white'
                  ></path>
                </svg>
              </span>
            </span>
          </Link>
          {/* Thông tin cá nhân */}
          <NavLink
            to={path.profile}
            className={({ isActive }) =>
              classNames('relative mb-3.75 flex items-center justify-start capitalize transition-colors', {
                'text-[#ee4d2d]': isActive,
                'text-gray-600 dark:text-gray-300': !isActive
              })
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reducedMotion && (
                  <motion.div
                    layoutId='activeNavIndicator'
                    className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5'
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && reducedMotion && <div className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5' />}
                <div className='relative z-10 flex items-center'>
                  <div className='mr-2 flex shrink-0 items-center justify-center rounded-sm'>
                    <img
                      src='https://down-vn.img.susercontent.com/file/ba61750a46794d8847c3f463c5e71cc4'
                      alt='Avatar'
                      className='h-6 w-6'
                    />
                  </div>
                  <span className='font-medium capitalize'>{t('sideNav.myAccount')}</span>
                </div>
              </>
            )}
          </NavLink>
          {/* Đổi mật khẩu */}
          <NavLink
            to={path.changePassword}
            className={({ isActive }) =>
              classNames('relative mt-4 mb-3.75 flex items-center justify-start capitalize transition-colors', {
                'text-[#ee4d2d]': isActive,
                'text-gray-600 dark:text-gray-300': !isActive
              })
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reducedMotion && (
                  <motion.div
                    layoutId='activeNavIndicator'
                    className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5'
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && reducedMotion && <div className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5' />}
                <div className='relative z-10 flex items-center'>
                  <div className='mr-2 flex shrink-0 items-center justify-center rounded-sm'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-6 w-6 text-blue-500'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'
                      />
                    </svg>
                  </div>
                  <span className='font-medium capitalize'>{t('sideNav.changePassword')}</span>
                </div>
              </>
            )}
          </NavLink>
          {/* Đơn mua */}
          <NavLink
            to={path.historyPurchases}
            className={({ isActive }) =>
              classNames('relative mt-4 mb-3.75 flex items-center justify-start capitalize transition-colors', {
                'text-[#ee4d2d]': isActive,
                'text-gray-600 dark:text-gray-300': !isActive
              })
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reducedMotion && (
                  <motion.div
                    layoutId='activeNavIndicator'
                    className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5'
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && reducedMotion && <div className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5' />}
                <div className='relative z-10 flex items-center'>
                  <div className='mr-2 flex shrink-0 items-center justify-center rounded-sm'>
                    <img
                      src='https://down-vn.img.susercontent.com/file/f0049e9df4e536bc3e7f140d071e9078'
                      alt='Avatar'
                      className='h-6 w-6'
                    />
                  </div>
                  <span className='font-medium capitalize'>{t('sideNav.purchaseOrders')}</span>
                </div>
              </>
            )}
          </NavLink>
          {/* Đơn hàng */}
          <NavLink
            to={path.orderList}
            className={({ isActive }) =>
              classNames('relative mt-4 mb-3.75 flex items-center justify-start capitalize transition-colors', {
                'text-[#ee4d2d]': isActive,
                'text-gray-600 dark:text-gray-300': !isActive
              })
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reducedMotion && (
                  <motion.div
                    layoutId='activeNavIndicator'
                    className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5'
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && reducedMotion && <div className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5' />}
                <div className='relative z-10 flex items-center'>
                  <div className='mr-2 flex shrink-0 items-center justify-center rounded-sm'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-6 w-6 text-blue-500'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z'
                      />
                    </svg>
                  </div>
                  <span className='font-medium capitalize'>{t('sideNav.orders')}</span>
                </div>
              </>
            )}
          </NavLink>
          {/* Điểm danh hàng ngày */}
          <NavLink
            to={path.dailyCheckIn}
            className={({ isActive }) =>
              classNames('relative mt-4 mb-3.75 flex items-center justify-start capitalize transition-colors', {
                'text-[#ee4d2d]': isActive,
                'text-gray-600 dark:text-gray-300': !isActive
              })
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reducedMotion && (
                  <motion.div
                    layoutId='activeNavIndicator'
                    className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5'
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && reducedMotion && <div className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5' />}
                <div className='relative z-10 flex items-center'>
                  <div className='mr-2 flex shrink-0 items-center justify-center rounded-sm'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-6 w-6 text-yellow-500'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z'
                      />
                    </svg>
                  </div>
                  <span className='font-medium capitalize'>{t('sideNav.dailyCheckIn')}</span>
                </div>
              </>
            )}
          </NavLink>
          {/* Địa chỉ giao hàng */}
          <NavLink
            to={path.addressBook}
            className={({ isActive }) =>
              classNames('relative mt-4 mb-3.75 flex items-center justify-start capitalize transition-colors', {
                'text-[#ee4d2d]': isActive,
                'text-gray-600 dark:text-gray-300': !isActive
              })
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reducedMotion && (
                  <motion.div
                    layoutId='activeNavIndicator'
                    className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5'
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && reducedMotion && <div className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5' />}
                <div className='relative z-10 flex items-center'>
                  <div className='mr-2 flex shrink-0 items-center justify-center rounded-sm'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-6 w-6 text-green-500'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' d='M15 10.5a3 3 0 11-6 0 3 3 0 016 0z' />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'
                      />
                    </svg>
                  </div>
                  <span className='font-medium capitalize'>{t('sideNav.address')}</span>
                </div>
              </>
            )}
          </NavLink>
          {/* Thông báo */}
          <NavLink
            to={path.notifications}
            className={({ isActive }) =>
              classNames('relative mt-4 mb-3.75 flex items-center justify-start capitalize transition-colors', {
                'text-[#ee4d2d]': isActive,
                'text-gray-600 dark:text-gray-300': !isActive
              })
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reducedMotion && (
                  <motion.div
                    layoutId='activeNavIndicator'
                    className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5'
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && reducedMotion && <div className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5' />}
                <div className='relative z-10 flex items-center'>
                  <div className='mr-2 flex shrink-0 items-center justify-center rounded-sm'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-6 w-6 text-[#ee4d2d]'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
                      />
                    </svg>
                  </div>
                  <span className='font-medium capitalize'>{t('sideNav.notifications')}</span>
                </div>
              </>
            )}
          </NavLink>
          {/* Lịch sử hội thoại */}
          <NavLink
            to={path.conversations}
            className={({ isActive }) =>
              classNames('relative mt-4 mb-3.75 flex items-center justify-start capitalize transition-colors', {
                'text-[#ee4d2d]': isActive,
                'text-gray-600 dark:text-gray-300': !isActive
              })
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reducedMotion && (
                  <motion.div
                    layoutId='activeNavIndicator'
                    className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5'
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && reducedMotion && <div className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5' />}
                <div className='relative z-10 flex items-center'>
                  <div className='mr-2 flex shrink-0 items-center justify-center rounded-sm'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-6 w-6 text-purple-500'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155'
                      />
                    </svg>
                  </div>
                  <span className='font-medium capitalize'>Lịch sử hội thoại</span>
                </div>
              </>
            )}
          </NavLink>
          {/* Thông báo giá */}
          <NavLink
            to={path.priceAlerts}
            className={({ isActive }) =>
              classNames('relative mt-4 mb-3.75 flex items-center justify-start capitalize transition-colors', {
                'text-[#ee4d2d]': isActive,
                'text-gray-600 dark:text-gray-300': !isActive
              })
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reducedMotion && (
                  <motion.div
                    layoutId='activeNavIndicator'
                    className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5'
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && reducedMotion && <div className='absolute inset-0 rounded-lg bg-[#ee4d2d]/5' />}
                <div className='relative z-10 flex items-center'>
                  <div className='mr-2 flex shrink-0 items-center justify-center rounded-sm'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-6 w-6 text-orange-500'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z'
                      />
                    </svg>
                  </div>
                  <span className='font-medium capitalize'>Thông báo giá</span>
                </div>
              </>
            )}
          </NavLink>
        </div>
      </div>
    </div>
  )
}

export default UserSideNav
