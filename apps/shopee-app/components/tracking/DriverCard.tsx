import React from 'react'
import { View, TouchableOpacity, Linking } from 'react-native'
import { Phone, Truck } from 'lucide-react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { TrackingUpdate } from '@/types/tracking.type'

interface DriverCardProps {
  tracking: TrackingUpdate
}

export default function DriverCard({ tracking }: DriverCardProps) {
  const colors = useColors()

  const handleCallDriver = () => {
    Linking.openURL(`tel:${tracking.driverPhone}`)
  }

  return (
    <View className="rounded-t-2xl px-4 py-4" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View
            className="items-center justify-center rounded-full p-2"
            style={{ backgroundColor: colors.neutrals800 }}>
            <Truck size={24} color={colors.primary} />
          </View>

          <View>
            <AppText raw variant="body" weight="semibold">
              {tracking.driverName}
            </AppText>
            <AppText raw variant="bodySmall" color="muted">
              {tracking.vehicleInfo}
            </AppText>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCallDriver}
          className="items-center justify-center rounded-full p-3"
          style={{ backgroundColor: colors.primary }}
          accessibilityRole="button"
          accessibilityLabel={`Call driver ${tracking.driverName}`}>
          <Phone size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {tracking.estimatedArrival && (
        <View className="mt-3 rounded-lg px-3 py-2" style={{ backgroundColor: colors.neutrals800 }}>
          <AppText raw variant="bodySmall" color="muted">
            Dự kiến giao hàng
          </AppText>
          <AppText raw variant="body" weight="semibold" className="mt-0.5">
            {new Date(tracking.estimatedArrival).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
            })}
          </AppText>
        </View>
      )}
    </View>
  )
}
