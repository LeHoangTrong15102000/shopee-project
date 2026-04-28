import React from 'react'
import { View, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Flame, Coins } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useCheckinStreak, useCheckIn } from '@/hooks/useCheckin'
import { useToast } from '@/components/ui/ToastProvider'
import CheckinCalendar from '@/components/checkin/CheckinCalendar'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { CheckinStreak } from '@/apis/checkin.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

export default function CheckinScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const { showSuccess } = useToast()

  const { data: streakData, isLoading } = useCheckinStreak()
  const { mutate: doCheckIn, isPending: isCheckingIn } = useCheckIn()

  const streak = streakData?.data as CheckinStreak | undefined
  const checkedInToday = streak?.checked_in_today ?? false
  const todayReward = streak?.today_reward ?? 10
  const streakCount = streak?.streak ?? 0
  const calendar = streak?.calendar ?? []

  const handleCheckIn = () => {
    doCheckIn(undefined, {
      onSuccess: (result) => {
        const earned = result?.data?.coins_earned ?? todayReward
        showSuccess(t('checkin.toast.success', { earned }))
      },
      onError: handleMutationError,
    })
  }

  const currentMonthLabel = new Date().toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('checkin.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Streak + reward info banner */}
            <View
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 24,
                paddingHorizontal: 16,
                alignItems: 'center',
                gap: 12,
              }}>
              <View className="flex-row items-center gap-2">
                <Flame size={28} color="#fff" />
                <AppText raw variant="heading2" style={{ color: '#fff', fontWeight: 'bold' }}>
                  {t('checkin.streak.label', { streakCount })}
                </AppText>
              </View>

              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <Coins size={18} color="#fff" />
                <AppText raw variant="body" style={{ color: '#fff' }}>
                  {t('checkin.reward.label')}{' '}
                  <AppText raw variant="body" style={{ color: '#fff', fontWeight: 'bold' }}>
                    +{todayReward} Xu
                  </AppText>
                </AppText>
              </View>
            </View>

            {/* Calendar section */}
            <View style={{ marginTop: 20 }}>
              <AppText
                raw
                variant="body"
                weight="semibold"
                style={{ paddingHorizontal: 16, marginBottom: 12, textTransform: 'capitalize' }}>
                {currentMonthLabel}
              </AppText>

              <CheckinCalendar calendar={calendar} checkedInToday={checkedInToday} />
            </View>

            {/* Check-in button */}
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
              <AppButton
                variant="primary"
                onPress={handleCheckIn}
                loading={isCheckingIn}
                disabled={checkedInToday || isCheckingIn}>
                {checkedInToday ? t('checkin.button.checkedIn') : t('checkin.button.checkIn')}
              </AppButton>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  )
}
