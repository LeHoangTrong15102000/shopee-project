import React from 'react'
import {
  View,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
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
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
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
      title: 'Yêu thích',
      icon: () => <Heart size={20} color={colors.primary} />,
      onPress: () => router.push('/wishlist'),
    },
    {
      title: 'Địa chỉ',
      icon: () => <MapPin size={20} color={colors.secondary} />,
      onPress: () => router.push('/addresses'),
    },
    {
      title: 'Thông báo',
      icon: () => <Bell size={20} color={colors.warning} />,
      onPress: () => router.push('/(tabs)/notifications'),
    },
    {
      title: 'Điểm danh',
      icon: () => <Calendar size={20} color={colors.success} />,
      onPress: () => router.push('/checkin'),
    },
    {
      title: 'Voucher của tôi',
      icon: () => <Tag size={20} color={colors.error} />,
      onPress: () => router.push('/vouchers'),
    },
  ]

  const settingsMenuItems = [
    {
      title: 'Giao diện tối',
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
      title: 'Ngôn ngữ',
      icon: () => <Globe size={20} color={colors.foreground} />,
      onPress: () => {},
    },
    {
      title: 'Đổi mật khẩu',
      icon: () => <Lock size={20} color={colors.foreground} />,
      onPress: () => router.push('/change-password'),
    },
    {
      title: 'Về ứng dụng',
      icon: () => <Info size={20} color={colors.foreground} />,
      onPress: () => {},
    },
  ]

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="border-b border-neutrals900 px-4 py-4">
        <AppText variant="heading2">Tài khoản</AppText>
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
            TIỆN ÍCH
          </AppText>
          <MenuList data={utilityMenuItems} />
        </View>

        <View className="border-t border-neutrals900 px-4 py-4">
          <AppText raw variant="bodySmall" weight="semibold" color="muted" className="mb-3">
            CÀI ĐẶT
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
                Đăng xuất
              </AppText>
            </View>
          </AppButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
