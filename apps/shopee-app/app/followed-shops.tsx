import React from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Store } from 'lucide-react-native'
import { EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function FollowedShopsScreen() {
  const { t } = useTranslation()
  const colors = useColors()

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('followedShops.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState icon={Store} message={t('followedShops.empty')} />
        </View>
      </SafeAreaView>
    </>
  )
}
