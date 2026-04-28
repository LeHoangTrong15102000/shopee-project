import React from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Bell, Shield } from 'lucide-react-native'
import { MenuList, AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function SettingsScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()

  const items = [
    {
      title: t('settings.notifications.title'),
      icon: () => <Bell size={20} color={colors.warning} />,
      onPress: () => router.push('/settings/notifications'),
    },
    {
      title: t('settings.privacy.title'),
      icon: () => <Shield size={20} color={colors.foreground} />,
      onPress: () => router.push('/settings/privacy'),
    },
  ]

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('settings.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="px-4 py-4">
          <MenuList data={items} />
        </View>
      </SafeAreaView>
    </>
  )
}
