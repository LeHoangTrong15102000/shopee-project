import { useEffect, useRef, useContext } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AppContext } from 'src/contexts/app.context'
import { useFocusTrap } from 'src/hooks/useFocusTrap'
import useInventoryAlerts from 'src/hooks/useInventoryAlerts'
import { loadLanguage, locales } from 'src/i18n/i18n'
import authApi from 'src/apis/auth.api'
import notificationApi from 'src/apis/notification.api'
import { purchasesStatus } from 'src/constant/purchase'
import path from 'src/constant/path'
import { getAvatarUrl } from 'src/utils/utils'
import { toast } from 'react-toastify'
import ThemeToggle from 'src/components/ThemeToggle'
import InventoryAlertBadge from 'src/components/InventoryAlertBadge'
import Button from 'src/components/Button'

interface MobileNavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const ITEM =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
const DIVIDER = 'my-3 h-px bg-gray-200 dark:bg-slate-600'
const SECTION_TITLE = 'px-3 pb-1 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500'

const MobileNavigationDrawer = ({ isOpen, onClose }: MobileNavigationDrawerProps) => {
  const { t, i18n } = useTranslation('nav')
  const currentLanguage = locales[i18n.language as keyof typeof locales]
  const { setIsAuthenticated, isAuthenticated, profile, setProfile } = useContext(AppContext)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const drawerRef = useRef<HTMLDivElement>(null)

  useFocusTrap({ isOpen, containerRef: drawerRef, onClose })

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000
  })
  const unreadCount = notificationsData?.data.data.unreadCount || 0

  const isAdmin = profile?.roles?.includes('Admin') ?? false
  const {
    alerts: inventoryAlerts,
    unreadCount: inventoryUnreadCount,
    clearAlerts: clearInventoryAlerts
  } = useInventoryAlerts()

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logoutAccount(),
    onSuccess: () => {
      setIsAuthenticated(false)
      setProfile(null)
      toast.success(t('drawer.logoutSuccess'), { autoClose: 1000 })
      queryClient.removeQueries({ queryKey: ['purchases', { status: purchasesStatus.inCart }], exact: true })
      onClose()
    }
  })

  const go = (to: string) => {
    onClose()
    navigate(to)
  }
  const handleLogout = () => logoutMutation.mutate()

  const handleTranslateLanguage = async (lng: 'en' | 'vi') => {
    try {
      await loadLanguage(lng)
    } catch (e) {
      console.error('Failed to load language:', e)
    }
  }

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-9998 bg-black md:hidden'
            onClick={onClose}
            aria-label='Close navigation drawer'
          />
          <motion.div
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className='fixed top-0 left-0 z-9999 h-full w-[280px] overflow-y-auto rounded-r-xl bg-white shadow-lg md:hidden dark:bg-slate-800'
            role='dialog'
            aria-modal='true'
            aria-label='Navigation drawer'
          >
            {/* Header */}
            <div className='sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-800'>
              <Link
                to={path.home}
                onClick={onClose}
                className='flex items-end gap-1 outline-none focus:outline-none focus-visible:outline-none'
              >
                <svg viewBox='0 0 54 65' className='h-9 fill-orange dark:fill-orange-400'>
                  <g fillRule='evenodd'>
                    <path d='M35.6717403 44.953764c-.3333497 2.7510509-2.0003116 4.9543414-4.5823845 6.0575984-1.4379707.6145919-3.36871.9463856-4.896954.8421628-2.3840266-.0911143-4.6237865-.6708937-6.6883352-1.7307424-.7375522-.3788551-1.8370513-1.1352759-2.6813095-1.8437757-.213839-.1790053-.239235-.2937577-.0977428-.4944671.0764015-.1151823.2172535-.3229831.5286218-.7791994.45158-.6616533.5079208-.7446018.5587128-.8221779.14448-.2217688.3792333-.2411091.6107855-.0588804.0243289.0189105.0243289.0189105.0426824.0333083.0379873.0294402.0379873.0294402.1276204.0990653.0907002.0706996.14448.1123887.166248.1287205 2.2265285 1.7438508 4.8196989 2.7495466 7.4376251 2.8501162 3.6423042-.0496401 6.2615109-1.6873341 6.7308041-4.2020035.5160305-2.7675977-1.6565047-5.1582742-5.9070334-6.4908212-1.329344-.4166762-4.6895175-1.7616869-5.3090528-2.1250697-2.9094471-1.7071043-4.2697358-3.9430584-4.0763845-6.7048539.296216-3.8283059 3.8501677-6.6835796 8.340785-6.702705 2.0082079-.004083 4.0121475.4132378 5.937338 1.2244562.6816382.2873109 1.8987274.9496089 2.3189359 1.2633517.2420093.1777159.2898136.384872.1510957.60836-.0774686.12958-.2055158.3350171-.4754821.7632974l-.0029878.0047276c-.3553311.5640922-.3664286.5817134-.447952.7136572-.140852.2144625-.3064598.2344475-.5604202.0732783-2.0600669-1.3839063-4.3437898-2.0801572-6.8554368-2.130442-3.126914.061889-5.4706057 1.9228561-5.6246892 4.4579402-.0409751 2.2896772 1.676352 3.9613243 5.3858811 5.2358503 7.529819 2.4196871 10.4113092 5.25648 9.869029 9.7292478M26.3725216 5.42669372c4.9022893 0 8.8982174 4.65220288 9.0851664 10.47578358H17.2875686c.186949-5.8235807 4.1828771-10.47578358 9.084953-10.47578358m25.370857 11.57065968c0-.6047069-.4870064-1.0948761-1.0875481-1.0948761h-11.77736c-.28896-7.68927544-5.7774923-13.82058185-12.5059489-13.82058185-6.7282432 0-12.2167755 6.13130641-12.5057355 13.82058185l-11.79421958.0002149c-.59136492.0107446-1.06748731.4968309-1.06748731 1.0946612 0 .0285807.00106706.0569465.00320118.0848825H.99995732l1.6812605 37.0613963c.00021341.1031483.00405483.2071562.01173767.3118087.00170729.0236381.003628.0470614.00554871.0704847l.00362801.0782207.00405483.004083c.25545428 2.5789222 2.12707837 4.6560709 4.67201764 4.7519129l.00576212.0055872h37.4122078c.0177132.0002149.0354264.0004298.0531396.0004298.0177132 0 .0354264-.0002149.0531396-.0004298h.0796027l.0017073-.0015043c2.589329-.0706995 4.6867431-2.1768587 4.9082648-4.787585l.0012805-.0012893.0017073-.0350275c.0021341-.0275062.0040548-.0547975.0057621-.0823037.0040548-.065757.0068292-.1312992.0078963-.1964115l1.8344904-37.207738h-.0012805c.001067-.0186956.0014939-.0376062.0014939-.0565167' />
                  </g>
                </svg>
                <span className='text-lg font-normal text-orange dark:text-orange-400'>Shopee</span>
              </Link>
              <Button
                variant='icon'
                animated={false}
                onClick={onClose}
                className='rounded-full p-1 hover:bg-gray-100 dark:hover:bg-slate-700'
                ariaLabel='Close navigation drawer'
              >
                <svg
                  className='h-6 w-6 text-gray-600 dark:text-gray-300'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </Button>
            </div>

            {/* Drawer Body */}
            <div className='p-4'>
              {/* Navigation Section */}
              <div className='space-y-1'>
                <button type='button' onClick={() => go(path.home)} className={ITEM}>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5 shrink-0'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'
                    />
                  </svg>
                  {t('drawer.home')}
                </button>

                <button type='button' onClick={() => go(path.notifications)} className={ITEM}>
                  <div className='relative shrink-0'>
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
                    {isAuthenticated && unreadCount > 0 && (
                      <span className='absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange text-[8px] text-white'>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>{t('drawer.notification')}</span>
                  {isAuthenticated && unreadCount > 0 && (
                    <span className='ml-auto rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-medium text-orange dark:bg-orange/20 dark:text-orange-400'>
                      {t('drawer.newCount', { count: unreadCount })}
                    </span>
                  )}
                </button>

                <button type='button' onClick={() => go(path.cart)} className={ITEM}>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5 shrink-0'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121 0 2.002-.881 2.002-2.003V6.75m-14.22 0h14.22m-14.22 0L5.106 5.272M7.5 14.25L5.106 5.272m0 0a2.25 2.25 0 00-2.147-1.584H2.25'
                    />
                  </svg>
                  {t('drawer.cart')}
                </button>

                <button type='button' onClick={() => go(path.wishlist)} className={ITEM}>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5 shrink-0'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z'
                    />
                  </svg>
                  {t('drawer.wishlist')}
                </button>

                <a
                  href='https://banhang.shopee.vn/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className={ITEM}
                  onClick={onClose}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5 shrink-0'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z'
                    />
                  </svg>
                  {t('drawer.sellerChannel')}
                </a>
              </div>

              <div className={DIVIDER} />

              {/* Settings Section */}
              <div className={SECTION_TITLE}>{t('drawer.settings')}</div>
              <div className='space-y-1'>
                {/* Theme Toggle */}
                <div className='flex items-center justify-between rounded-lg px-3 py-2.5'>
                  <span className='flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-5 w-5 shrink-0'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z'
                      />
                    </svg>
                    {t('drawer.theme')}
                  </span>
                  <ThemeToggle colorClassName='text-gray-600 dark:text-gray-300' />
                </div>

                {/* Language Switcher */}
                <div className='flex items-center justify-between rounded-lg px-3 py-2.5'>
                  <span className='flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-5 w-5 shrink-0'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418'
                      />
                    </svg>
                    {t('drawer.language')}
                  </span>
                  <div className='flex gap-1.5'>
                    <Button
                      animated={false}
                      onClick={() => handleTranslateLanguage('vi')}
                      className={`min-w-[44px] rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${currentLanguage === 'Tiếng Việt' ? 'bg-orange text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'}`}
                    >
                      VI
                    </Button>
                    <Button
                      animated={false}
                      onClick={() => handleTranslateLanguage('en')}
                      className={`min-w-[44px] rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${currentLanguage === 'English' ? 'bg-orange text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'}`}
                    >
                      EN
                    </Button>
                  </div>
                </div>

                {/* Inventory Alerts - Admin only */}
                {isAdmin && isAuthenticated && (
                  <div className='flex items-center justify-between rounded-lg px-3 py-2.5'>
                    <span className='flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        strokeWidth={1.5}
                        stroke='currentColor'
                        className='h-5 w-5 shrink-0'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'
                        />
                      </svg>
                      {t('drawer.inventoryAlerts')}
                    </span>
                    <InventoryAlertBadge
                      alerts={inventoryAlerts}
                      unreadCount={inventoryUnreadCount}
                      onClear={clearInventoryAlerts}
                      className='cursor-pointer'
                    />
                  </div>
                )}
              </div>

              <div className={DIVIDER} />

              {/* Account Section */}
              <div className={SECTION_TITLE}>{t('drawer.account')}</div>
              {isAuthenticated ? (
                <div className='space-y-1'>
                  {/* User info */}
                  <div className='flex items-center gap-3 rounded-lg px-3 py-2.5'>
                    <div className='h-8 w-8 shrink-0'>
                      <img
                        src={getAvatarUrl(profile?.avatar)}
                        alt='avatar'
                        className='h-full w-full rounded-full object-cover'
                      />
                    </div>
                    <span className='truncate text-sm font-medium text-gray-800 dark:text-gray-100'>
                      {profile?.email}
                    </span>
                  </div>
                  <button type='button' onClick={() => go(path.profile)} className={ITEM}>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-5 w-5 shrink-0'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
                      />
                    </svg>
                    {t('drawer.myAccount')}
                  </button>
                  <button type='button' onClick={() => go(path.historyPurchases)} className={ITEM}>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-5 w-5 shrink-0'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z'
                      />
                    </svg>
                    {t('drawer.myOrders')}
                  </button>
                  <button
                    type='button'
                    onClick={handleLogout}
                    className={`${ITEM} text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20`}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-5 w-5 shrink-0'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75'
                      />
                    </svg>
                    {t('drawer.logout')}
                  </button>
                </div>
              ) : (
                <div className='space-y-2 px-3 pt-1'>
                  <Link
                    to={path.login}
                    onClick={onClose}
                    className='block w-full rounded-lg bg-orange py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-orange/90'
                  >
                    {t('drawer.login')}
                  </Link>
                  <Link
                    to={path.register}
                    onClick={onClose}
                    className='block w-full rounded-lg border border-orange py-2.5 text-center text-sm font-medium text-orange transition-colors hover:bg-orange/5 dark:text-orange-400 dark:hover:bg-orange/10'
                  >
                    {t('drawer.register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(drawerContent, document.body)
}

export default MobileNavigationDrawer
