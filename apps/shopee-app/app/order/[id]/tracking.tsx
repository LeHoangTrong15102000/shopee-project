import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams } from 'expo-router'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useOrderTracking } from '@/hooks/useOrderTracking'
import TrackingMap from '@/components/tracking/TrackingMap'
import DriverCard from '@/components/tracking/DriverCard'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

const TIMELINE_STEPS = [
  { key: 'confirmed', label: 'Xác nhận' },
  { key: 'picking_up', label: 'Lấy hàng' },
  { key: 'in_transit', label: 'Vận chuyển' },
  { key: 'out_for_delivery', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
] as const

const STATUS_ORDER = TIMELINE_STEPS.map((s) => s.key)

function StatusTimeline({ status }: { status: string }) {
  const colors = useColors()
  const currentIndex = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number])

  return (
    <View className="flex-row items-center px-3 py-3" style={{ backgroundColor: colors.background }}>
      {TIMELINE_STEPS.map((step, index) => {
        const isDone = index <= currentIndex
        const isActive = index === currentIndex
        return (
          <React.Fragment key={step.key}>
            <View className="items-center" style={{ flex: 1 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isDone ? colors.primary : colors.neutrals700,
                  borderWidth: isActive ? 2 : 0,
                  borderColor: colors.primary,
                }}
              />
              <AppText
                raw
                variant="labelSmall"
                style={{
                  color: isDone ? colors.primary : colors.neutrals400,
                  marginTop: 4,
                  fontSize: 9,
                  textAlign: 'center',
                }}>
                {step.label}
              </AppText>
            </View>
            {index < TIMELINE_STEPS.length - 1 && (
              <View
                style={{
                  height: 2,
                  flex: 1,
                  backgroundColor: index < currentIndex ? colors.primary : colors.neutrals700,
                  marginBottom: 14,
                }}
              />
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

export default function OrderTrackingScreen() {
  const colors = useColors()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { tracking, isLoading, isError, refetch } = useOrderTracking(id)

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Theo dõi đơn hàng',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {isError && !tracking && (
          <View className="flex-1 items-center justify-center px-4 gap-3">
            <AppText raw variant="body" color="muted" align="center">
              Không thể tải thông tin theo dõi
            </AppText>
            <AppButton variant="outline" size="sm" onPress={() => refetch()}>
              Thử lại
            </AppButton>
          </View>
        )}

        {tracking && (
          <View className="flex-1">
            {/* Map takes up most of the screen */}
            <View style={{ flex: 1 }}>
              <TrackingMap tracking={tracking} />
            </View>

            {/* Multi-step status timeline */}
            <StatusTimeline status={tracking.status} />

            {/* Driver card at bottom */}
            <DriverCard tracking={tracking} />
          </View>
        )}
      </SafeAreaView>
    </>
  )
}
