import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router'
import path from 'src/constant/path'
import MobileAccountNav from 'src/components/MobileAccountNav'
import { AppContext } from 'src/contexts/app.context'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { getAvatarUrl } from 'src/utils/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  to: string
  labelKey: string
  icon: React.ReactNode
}

interface NavGroup {
  id: string
  labelKey: string
  icon: React.ReactNode
  /** Direct link — renders as NavLink, not an accordion toggle */
  directLink?: string
  items?: NavItem[]
}

// ─── Icon helpers (inline SVG keeps the file self-contained) ─────────────────

const IconUser = () => (
  <img
    src="https://down-vn.img.susercontent.com/file/ba61750a46794d8847c3f463c5e71cc4"
    alt=""
    className="h-6 w-6"
  />
)

const IconCart = () => (
  <img
    src="https://down-vn.img.susercontent.com/file/f0049e9df4e536bc3e7f140d071e9078"
    alt=""
    className="h-6 w-6"
  />
)

const IconBell = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-6 w-6 text-[#ee4d2d]"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
    />
  </svg>
)

const IconWrench = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-6 w-6 text-purple-500"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
    />
  </svg>
)

// ─── NavItem icons ────────────────────────────────────────────────────────────

const IconProfile = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5 text-blue-400"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
)

const IconAddress = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5 text-green-500"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
    />
  </svg>
)

const IconLock = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5 text-blue-500"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
)

const IconShield = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5 text-green-600"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
)

const IconChat = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5 text-purple-500"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
    />
  </svg>
)

const IconCalendar = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5 text-yellow-500"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
    />
  </svg>
)

const IconCoin = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5 text-amber-500"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const IconAlertBell = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5 text-orange-500"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
    />
  </svg>
)

// ─── NavItem component ────────────────────────────────────────────────────────

interface NavItemProps {
  item: NavItem
  reducedMotion: boolean
}

const NavItemLink = ({ item, reducedMotion }: NavItemProps) => (
  <NavLink
    to={item.to}
    className={({ isActive }) =>
      classNames('relative flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors', {
        'text-[#ee4d2d]': isActive,
        'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100': !isActive,
      })
    }
  >
    {({ isActive }) => (
      <>
        {isActive && !reducedMotion && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute inset-0 rounded-md bg-[#ee4d2d]/5"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        {isActive && reducedMotion && (
          <div className="absolute inset-0 rounded-md bg-[#ee4d2d]/5" />
        )}
        <span className="relative z-10 flex shrink-0 items-center">{item.icon}</span>
        <span className="relative z-10 text-sm font-normal capitalize">{item.labelKey}</span>
      </>
    )}
  </NavLink>
)

// ─── AccordionGroup component ─────────────────────────────────────────────────

interface AccordionGroupProps {
  group: NavGroup
  reducedMotion: boolean
  isOpen: boolean
  onToggle: () => void
}

const AccordionGroup = ({ group, reducedMotion, isOpen, onToggle }: AccordionGroupProps) => {
  if (group.directLink) {
    // Direct NavLink — not an accordion toggle
    return (
      <NavLink
        to={group.directLink}
        className={({ isActive }) =>
          classNames(
            'relative flex items-center gap-2 rounded-md px-2 py-2 transition-colors capitalize',
            {
              'text-[#ee4d2d]': isActive,
              'text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white':
                !isActive,
            },
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && !reducedMotion && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute inset-0 rounded-md bg-[#ee4d2d]/5"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            {isActive && reducedMotion && (
              <div className="absolute inset-0 rounded-md bg-[#ee4d2d]/5" />
            )}
            <span className="relative z-10 flex shrink-0 items-center">{group.icon}</span>
            <span className="relative z-10 text-sm font-normal">{group.labelKey}</span>
          </>
        )}
      </NavLink>
    )
  }

  return (
    <div>
      {/* Group header — toggles expand/collapse */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 capitalize
                      text-gray-700 transition-colors hover:text-gray-900
                      focus-visible:ring-2 focus-visible:ring-[#ee4d2d]/50 focus-visible:outline-none
                      dark:text-gray-200 dark:hover:text-white"
      >
        <span className="flex shrink-0 items-center">{group.icon}</span>
        <span className="flex-1 text-left text-sm font-normal">{group.labelKey}</span>
      </button>

      {/* Collapsible children */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            animate={reducedMotion ? undefined : { height: 'auto', opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-gray-200 pl-3 dark:border-slate-600">
              {group.items?.map((item) => (
                <NavItemLink key={item.to} item={item} reducedMotion={reducedMotion} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main UserSideNav ─────────────────────────────────────────────────────────

const UserSideNav = () => {
  const { t } = useTranslation('user')
  const { profile } = useContext(AppContext)
  const reducedMotion = useReducedMotion()
  const location = useLocation()

  // Build nav groups
  const groups: NavGroup[] = [
    {
      id: 'account',
      labelKey: t('sideNav.groupMyAccount'),
      icon: <IconUser />,
      items: [
        { to: path.profile, labelKey: t('sideNav.profile'), icon: <IconProfile /> },
        { to: path.addressBook, labelKey: t('sideNav.address'), icon: <IconAddress /> },
        {
          to: path.changePassword,
          labelKey: t('sideNav.changePassword'),
          icon: <IconLock />,
        },
        { to: path.security, labelKey: t('sideNav.security'), icon: <IconShield /> },
      ],
    },
    {
      id: 'orders',
      labelKey: t('sideNav.purchaseOrders'),
      icon: <IconCart />,
      directLink: path.historyPurchases,
    },
    {
      id: 'notifications',
      labelKey: t('sideNav.groupNotifications'),
      icon: <IconBell />,
      items: [
        {
          to: path.notifications,
          labelKey: t('sideNav.notifications'),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 text-[#ee4d2d]"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          ),
        },
        {
          to: path.conversations,
          labelKey: t('sideNav.conversations'),
          icon: <IconChat />,
        },
      ],
    },
    {
      id: 'utilities',
      labelKey: t('sideNav.groupUtilities'),
      icon: <IconWrench />,
      items: [
        {
          to: path.dailyCheckIn,
          labelKey: t('sideNav.dailyCheckIn'),
          icon: <IconCalendar />,
        },
        { to: path.loyalty, labelKey: t('sideNav.loyalty'), icon: <IconCoin /> },
        {
          to: path.priceAlerts,
          labelKey: t('sideNav.priceAlerts'),
          icon: <IconAlertBell />,
        },
        {
          to: path.myVouchers,
          labelKey: t('sideNav.vouchers'),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 text-pink-500"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
              />
            </svg>
          ),
        },
      ],
    },
  ]

  // Auto-open the group containing the active route
  function getInitialOpenGroup(): string | null {
    for (const group of groups) {
      if (group.directLink) continue
      if (group.items?.some((item) => location.pathname.startsWith(item.to))) {
        return group.id
      }
    }
    return null
  }

  const [openGroupId, setOpenGroupId] = useState<string | null>(getInitialOpenGroup)

  function handleToggle(groupId: string) {
    setOpenGroupId((prev) => (prev === groupId ? null : groupId))
  }

  return (
    <div>
      {/* Mobile horizontal icon+label tab bar */}
      <MobileAccountNav className="mb-0" />

      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        {/* Avatar + edit profile */}
        <div className="flex items-center border-b border-b-gray-200 py-4 dark:border-b-slate-700">
          <Link
            to={path.profile}
            className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-slate-600"
          >
            <img
              src={getAvatarUrl(profile?.avatar)}
              alt="avatar_profile"
              className="h-full w-full object-cover"
            />
          </Link>
          <div className="grow pl-[14px]">
            <div className="mb-1 truncate font-semibold text-gray-600 dark:text-gray-300">
              {profile?.name}
            </div>
            <Link to={path.profile} className="flex items-center bg-transparent capitalize">
              <svg
                width={12}
                height={12}
                viewBox="0 0 12 12"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              >
                <path
                  d="M8.54 0L6.987 1.56l3.46 3.48L12 3.48M0 8.52l.073 3.428L3.46 12l6.21-6.18-3.46-3.48"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </svg>
              <span className="text-[#888] capitalize dark:text-gray-400">
                {t('sideNav.editProfile')}
              </span>
            </Link>
          </div>
        </div>

        {/* Accordion navigation */}
        <nav className="mt-4 flex flex-col gap-1" aria-label={t('sideNav.groupMyAccount')}>
          {groups.map((group) => (
            <AccordionGroup
              key={group.id}
              group={group}
              reducedMotion={reducedMotion}
              isOpen={openGroupId === group.id}
              onToggle={() => handleToggle(group.id)}
            />
          ))}
        </nav>
      </div>
    </div>
  )
}

export default UserSideNav
