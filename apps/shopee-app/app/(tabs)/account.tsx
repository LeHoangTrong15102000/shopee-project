import React, { useRef } from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { LogOut } from 'lucide-react-native'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useProfile } from '@/hooks/useProfile'
import { useDialog } from '@/components/ui/DialogProvider'
import ProfileHeader from '@/components/account/ProfileHeader'
import OrderShortcuts from '@/components/account/OrderShortcuts'
import UtilityMenu from '@/components/account/UtilityMenu'
import SettingsMenu from '@/components/account/SettingsMenu'
import LanguagePicker from '@/components/account/LanguagePicker'

export default function AccountScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { showConfirm } = useDialog()
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const logout = useAuthStore((state) => state.logout)
  const languagePickerRef = useRef<BottomSheetModal>(null)

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

        <UtilityMenu
          onWishlist={() => router.push('/wishlist')}
          onAddresses={() => router.push('/addresses')}
          onNotifications={() => router.push('/(tabs)/notifications')}
          onCheckin={() => router.push('/checkin')}
          onVouchers={() => router.push('/vouchers')}
          onXuHistory={() => router.push('/xu-history')}
          onFollowedShops={() => router.push('/followed-shops')}
          onHelp={() => router.push('/help')}
        />

        <SettingsMenu
          isDarkMode={theme === 'dark'}
          onToggleDarkMode={toggleTheme}
          onLanguage={() => languagePickerRef.current?.present()}
          onChangePassword={() => router.push('/change-password')}
          onAbout={() => router.push('/about')}
          onSettings={() => router.push('/settings')}
        />

        <View className="px-4 py-4 pb-8">
          <AppButton variant="outline" onPress={handleLogout} className="w-full">
            <View className="flex-row items-center gap-2">
              <LogOut size={16} color={colors.error} />
              <AppText raw variant="body" style={{ color: colors.error }}>
                {t('account.button.logout')}
              </AppText>
            </View>
          </AppButton>
        </View>
      </ScrollView>

      <LanguagePicker bottomSheetRef={languagePickerRef} />
    </SafeAreaView>
  )
}
