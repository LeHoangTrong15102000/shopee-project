import React from 'react'
import {
  View,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Heart,
  MapPin,
  Bell,
  Calendar,
  Tag,
  Moon,
  Globe,
  Lock,
  Info,
  LogOut,
} from 'lucide-react-native'
import { AppText, AppButton, Switch, MenuList } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useProfile } from '@/hooks/useProfile'
import { useDialog } from '@/components/ui/DialogProvider'
import ProfileHeader from '@/components/account/ProfileHeader'
import OrderShortcuts from '@/components/account/OrderShortcuts'

export default function AccountScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { showConfirm } = useDialog()
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const logout = useAuthStore((state) => state.logout)

  const { data: profileData, isLoading, refetch, isRefetching } = useProfile()
  const user = profileData?.data?.data ?? null

  const handleLogout = () => {
    showConfirm(
      t('account.dialog.logoutTitle'),
      t('account.dialog.logoutMessage'),
      () => {
        logout()
        router.replace('/(auth)/sign-in')
      },
      undefined,
      'horizontal'
    )
  }

  const utilityMenuItems = [
    {
      title: t('account.menu.wishlist'),
      icon: () => <Heart size={20} color={colors.primary} />,
      onPress: () => router.push('/wishlist'),
    },
    {
      title: t('account.menu.addresses'),
      icon: () => <MapPin size={20} color={colors.secondary} />,
      onPress: () => router.push('/addresses'),
    },
    {
      title: t('account.menu.notifications'),
      icon: () => <Bell size={20} color={colors.warning} />,
      onPress: () => router.push('/(tabs)/notifications'),
    },
    {
      title: t('account.menu.checkin'),
      icon: () => <Calendar size={20} color={colors.success} />,
      onPress: () => router.push('/checkin'),
    },
    {
      title: t('account.menu.vouchers'),
      icon: () => <Tag size={20} color={colors.error} />,
      onPress: () => router.push('/vouchers'),
    },
  ]

  const settingsMenuItems = [
    {
      title: t('account.settings.darkMode'),
      icon: () => <Moon size={20} color={colors.foreground} />,
      value: (
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          size="sm"
        />
      ) as React.ReactNode,
      onPress: toggleTheme,
    },
    {
      title: t('account.settings.language'),
      icon: () => <Globe size={20} color={colors.foreground} />,
      onPress: () => undefined,
    },
    {
      title: t('account.settings.changePassword'),
      icon: () => <Lock size={20} color={colors.foreground} />,
      onPress: () => router.push('/change-password'),
    },
    {
      title: t('account.settings.about'),
      icon: () => <Info size={20} color={colors.foreground} />,
      onPress: () => undefined,
    },
  ]

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="border-b border-neutrals900 px-4 py-4">
        <AppText variant="heading2">{t('account.header.title')}</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }>
        <ProfileHeader user={user} isLoading={isLoading} />

        <OrderShortcuts />

        <View className="px-4 py-4">
          <AppText raw variant="bodySmall" weight="semibold" color="muted" className="mb-3">
            {t('account.section.utilities')}
          </AppText>
          <MenuList data={utilityMenuItems} />
        </View>

        <View className="border-t border-neutrals900 px-4 py-4">
          <AppText raw variant="bodySmall" weight="semibold" color="muted" className="mb-3">
            {t('account.section.settings')}
          </AppText>
          <MenuList data={settingsMenuItems} />
        </View>

        <View className="px-4 py-4 pb-8">
          <AppButton
            variant="outline"
            onPress={handleLogout}
            className="w-full">
            <View className="flex-row items-center gap-2">
              <LogOut size={16} color={colors.error} />
              <AppText raw variant="body" style={{ color: colors.error }}>
                {t('account.button.logout')}
              </AppText>
            </View>
          </AppButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
