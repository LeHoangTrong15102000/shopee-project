import React from 'react'
import { View, ScrollView, Linking, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

const PRIVACY_POLICY_URL = 'https://example.com/privacy'
const TERMS_OF_SERVICE_URL = 'https://example.com/terms'

export default function AboutScreen() {
  const { t } = useTranslation()
  const colors = useColors()

  const appVersion = Constants.expoConfig?.version ?? '—'
  const buildNumber =
    Platform.OS === 'ios'
      ? (Constants.expoConfig?.ios?.buildNumber ?? '—')
      : Platform.OS === 'android'
        ? (Constants.expoConfig?.android?.versionCode?.toString() ?? '—')
        : '—'

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('about.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <View className="mb-6 items-center py-6">
            <AppText raw variant="heading2" weight="bold" className="mb-1">
              Shopee
            </AppText>
            <AppText raw variant="bodySmall" color="muted">
              {t('about.tagline')}
            </AppText>
          </View>

          <View className="mb-4 rounded-xl border border-neutrals700 bg-neutrals900 px-4 py-4">
            <AppText raw variant="label" weight="semibold" color="muted" className="mb-3">
              {t('about.section.appInfo')}
            </AppText>

            <View className="flex-row items-center justify-between py-2">
              <AppText raw variant="body" color="muted">
                {t('about.field.version')}
              </AppText>
              <AppText raw variant="body" weight="medium">
                {appVersion}
              </AppText>
            </View>

            <View className="border-t border-neutrals700" />

            <View className="flex-row items-center justify-between py-2">
              <AppText raw variant="body" color="muted">
                {t('about.field.build')}
              </AppText>
              <AppText raw variant="body" weight="medium">
                {buildNumber}
              </AppText>
            </View>
          </View>

          <View className="rounded-xl border border-neutrals700 bg-neutrals900 px-4 py-4">
            <AppText raw variant="label" weight="semibold" color="muted" className="mb-3">
              {t('about.section.legal')}
            </AppText>

            <Pressable
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
              className="flex-row items-center justify-between py-2"
              accessibilityRole="link"
              accessibilityLabel={t('about.link.privacyPolicy')}>
              <AppText raw variant="body" style={{ color: colors.primary }}>
                {t('about.link.privacyPolicy')}
              </AppText>
            </Pressable>

            <View className="border-t border-neutrals700" />

            <Pressable
              onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
              className="flex-row items-center justify-between py-2"
              accessibilityRole="link"
              accessibilityLabel={t('about.link.termsOfService')}>
              <AppText raw variant="body" style={{ color: colors.primary }}>
                {t('about.link.termsOfService')}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
