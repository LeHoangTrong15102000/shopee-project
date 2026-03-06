import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext } from 'react'
import { toast } from 'react-toastify'
import authApi from 'src/apis/auth.api'
import { purchasesStatus } from 'src/constant/purchase'
import { AppContext } from 'src/contexts/app.context'
import { useTranslation } from 'react-i18next'
import notificationApi from 'src/apis/notification.api'
import useInventoryAlerts from 'src/hooks/useInventoryAlerts'
import { loadLanguage, locales } from 'src/i18n/i18n'
import NavHeaderCompact from './components/NavHeaderCompact'
import NavHeaderFull from './components/NavHeaderFull'

interface NavHeaderProps {
  compact?: boolean
}

const NavHeader = ({ compact = false }: NavHeaderProps) => {
  const { t, i18n } = useTranslation('nav')
  const currentLanguage = locales[i18n.language as keyof typeof locales]
  const { setIsAuthenticated, isAuthenticated, profile, setProfile } = useContext(AppContext)
  const queryClient = useQueryClient()

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logoutAccount(),
    onSuccess: () => {
      setIsAuthenticated(false)
      setProfile(null)
      toast.success(t('header.logoutSuccess'), { autoClose: 1000 })
      queryClient.removeQueries({ queryKey: ['purchases', { status: purchasesStatus.inCart }], exact: true })
    }
  })

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  const handleTranslateLanguage = async (lng: 'en' | 'vi') => {
    try {
      await loadLanguage(lng)
    } catch (error) {
      console.error('Failed to load language:', error)
    }
  }

  const unreadCount = notificationsData?.data.data.unreadCount || 0
  const isAdmin = profile?.roles?.includes('Admin') ?? false
  const {
    alerts: inventoryAlerts,
    unreadCount: inventoryUnreadCount,
    clearAlerts: clearInventoryAlerts
  } = useInventoryAlerts()

  if (compact) {
    return (
      <NavHeaderCompact
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        inventoryAlerts={inventoryAlerts}
        inventoryUnreadCount={inventoryUnreadCount}
        clearInventoryAlerts={clearInventoryAlerts}
        unreadCount={unreadCount}
        handleTranslateLanguage={handleTranslateLanguage}
        notificationsData={notificationsData}
        profile={profile}
      />
    )
  }

  return (
    <NavHeaderFull
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      inventoryAlerts={inventoryAlerts}
      inventoryUnreadCount={inventoryUnreadCount}
      clearInventoryAlerts={clearInventoryAlerts}
      unreadCount={unreadCount}
      handleTranslateLanguage={handleTranslateLanguage}
      currentLanguage={currentLanguage}
      profile={profile}
      handleLogout={handleLogout}
    />
  )
}

export default NavHeader
