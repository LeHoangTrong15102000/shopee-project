import React from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { CheckCircle } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

export default function OrderSuccessScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { orderId } = useLocalSearchParams<{ orderId: string }>()

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center px-8">
          <CheckCircle size={80} color={colors.success} />

          <AppText
            raw
            variant="heading2"
            weight="bold"
            style={{ marginTop: 24, marginBottom: 8, textAlign: 'center' }}>
            {t('orderSuccess.title')}
          </AppText>

          {orderId && (
            <AppText
              raw
              variant="bodySmall"
              color="muted"
              style={{ textAlign: 'center', marginBottom: 32 }}>
              {t('orderSuccess.orderId', { orderId: orderId.slice(-8).toUpperCase() })}
            </AppText>
          )}

          <View className="w-full gap-3">
            {orderId && (
              <AppButton
                variant="primary"
                onPress={() => router.push({ pathname: '/order/[id]', params: { id: orderId } })}
                className="w-full">
                {t('orderSuccess.button.viewOrder')}
              </AppButton>
            )}

            <AppButton
              variant="outline"
              onPress={() => router.replace('/(tabs)/home')}
              className="w-full">
              {t('orderSuccess.button.continueShopping')}
            </AppButton>
          </View>
        </View>
      </SafeAreaView>
    </>
  )
}
