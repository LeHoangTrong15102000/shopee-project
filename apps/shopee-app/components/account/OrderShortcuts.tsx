import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Clock, Truck, CheckCircle, XCircle } from 'lucide-react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

interface ShortcutItem {
  label: string
  icon: React.ReactNode
  status: string
}

export default function OrderShortcuts() {
  const colors = useColors()
  const router = useRouter()

  const shortcuts: ShortcutItem[] = [
    {
      label: 'Chờ xác nhận',
      icon: <Clock size={24} color={colors.primary} />,
      status: 'pending',
    },
    {
      label: 'Đang giao',
      icon: <Truck size={24} color={colors.secondary} />,
      status: 'shipping',
    },
    {
      label: 'Đã giao',
      icon: <CheckCircle size={24} color={colors.success} />,
      status: 'delivered',
    },
    {
      label: 'Đã hủy',
      icon: <XCircle size={24} color={colors.error} />,
      status: 'cancelled',
    },
  ]

  return (
    <View className="border-b border-neutrals900 bg-background px-4 py-4">
      <View className="mb-3 flex-row items-center justify-between">
        <AppText raw variant="body" weight="semibold">
          Đơn hàng của tôi
        </AppText>
        <TouchableOpacity onPress={() => router.push('/orders')}>
          <AppText raw variant="bodySmall" color="primary">
            Xem tất cả
          </AppText>
        </TouchableOpacity>
      </View>

      <View className="flex-row">
        {shortcuts.map((item) => (
          <TouchableOpacity
            key={item.status}
            onPress={() => router.push({ pathname: '/orders', params: { status: item.status } })}
            style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.neutrals1000,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {item.icon}
            </View>
            <AppText raw variant="labelSmall" style={{ textAlign: 'center' }} numberOfLines={2}>
              {item.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
