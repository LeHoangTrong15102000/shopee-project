import React, { useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText, Switch } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function NotificationSettingsScreen() {
  const { t } = useTranslation()
  const colors = useColors()

  const [orderUpdates, setOrderUpdates] = useState(true)
  const [promotions, setPromotions] = useState(true)
  const [system, setSystem] = useState(true)

  const rows = [
    {
      label: t('settings.notifications.orderUpdates'),
      value: orderUpdates,
      onChange: setOrderUpdates,
    },
    {
      label: t('settings.notifications.promotions'),
      value: promotions,
      onChange: setPromotions,
    },
    {
      label: t('settings.notifications.system'),
      value: system,
      onChange: setSystem,
    },
  ]

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('settings.notifications.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="px-4 py-4 gap-4">
          {rows.map((row) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.neutrals800,
              }}>
              <AppText raw variant="body">
                {row.label}
              </AppText>
              <Switch value={row.value} onValueChange={row.onChange} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    </>
  )
}
