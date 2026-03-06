import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import path from 'src/constant/path'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import Button from 'src/components/Button'

// ChevronDown icon
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
    className={className}
  >
    <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
  </svg>
)

// Mobile tab navigation items with icons
const mobileNavItems = [
  {
    to: path.profile,
    label: 'Tài khoản',
    icon: (
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
          d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
        />
      </svg>
    )
  },
  {
    to: path.changePassword,
    label: 'Mật khẩu',
    icon: (
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
          d='M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'
        />
      </svg>
    )
  },
  {
    to: path.historyPurchases,
    label: 'Đơn mua',
    icon: (
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
          d='M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z'
        />
      </svg>
    )
  },
  {
    to: path.orderList,
    label: 'Đơn hàng',
    icon: (
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
          d='M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z'
        />
      </svg>
    )
  },
  {
    to: path.dailyCheckIn,
    label: 'Điểm danh',
    icon: (
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
          d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z'
        />
      </svg>
    )
  },
  {
    to: path.addressBook,
    label: 'Địa chỉ',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='h-5 w-5'
      >
        <path strokeLinecap='round' strokeLinejoin='round' d='M15 10.5a3 3 0 11-6 0 3 3 0 016 0z' />
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'
        />
      </svg>
    )
  },
  {
    to: path.notifications,
    label: 'Thông báo',
    icon: (
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
          d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
        />
      </svg>
    )
  }
]

interface MobileAccountNavProps {
  className?: string
}

const MobileAccountNav = ({ className }: MobileAccountNavProps) => {
  const reducedMotion = useReducedMotion()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Find current active item based on location
  const activeItem = mobileNavItems.find((item) => location.pathname === item.to) || mobileNavItems[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleSelect = useCallback(
    (to: string) => {
      setIsOpen(false)
      navigate(to)
    },
    [navigate]
  )

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return (
    <div ref={dropdownRef} className={classNames('relative bg-white md:hidden dark:bg-slate-800', className)}>
      {/* Dropdown trigger button */}
      <Button
        variant='ghost'
        animated={false}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        ariaLabel='Menu tài khoản'
        className='flex w-full items-center justify-between px-3 py-2.5 text-left'
      >
        <div className='flex items-center gap-2'>
          <span className='text-[#ee4d2d] dark:text-orange-400'>{activeItem.icon}</span>
          <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>{activeItem.label}</span>
        </div>
        <ChevronDownIcon
          className={classNames('h-4 w-4 text-gray-400 transition-transform dark:text-gray-500', {
            'rotate-180': isOpen,
            'duration-200': !reducedMotion
          })}
        />
      </Button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.12 }}
            role='listbox'
            aria-label='Chọn trang tài khoản'
            className='absolute top-full right-0 left-0 z-50 mt-px overflow-hidden rounded-b-lg border border-gray-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800'
          >
            {mobileNavItems.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Button
                  key={item.to}
                  variant='ghost'
                  animated={false}
                  role='option'
                  aria-selected={isActive}
                  onClick={() => handleSelect(item.to)}
                  className={classNames('flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors', {
                    'bg-orange-50 text-[#ee4d2d] dark:bg-orange-900/20 dark:text-orange-400': isActive,
                    'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700': !isActive
                  })}
                >
                  <span
                    className={classNames(
                      'shrink-0',
                      isActive ? 'text-[#ee4d2d] dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className='font-medium'>{item.label}</span>
                </Button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileAccountNav
