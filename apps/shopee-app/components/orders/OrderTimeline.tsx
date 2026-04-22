import React from 'react'
import { View } from 'react-native'
import { CheckCircle, Clock, Package, Truck, XCircle, RotateCcw } from 'lucide-react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { ORDER_STATUS } from '@/constants/order'

interface TimelineStep {
  label: string
  timestamp?: string
  completed: boolean
  icon: React.ReactNode
}

interface OrderTimelineProps {
  status: string
  createdAt?: string
}

export default function OrderTimeline({
  status,
  createdAt,
}: OrderTimelineProps) {
  const colors = useColors()

  if (status === ORDER_STATUS.CANCELLED) {
    const steps: TimelineStep[] = [
      {
        label: 'Đặt hàng',
        timestamp: createdAt,
        completed: true,
        icon: <Clock size={16} color="#fff" />,
      },
      {
        label: 'Đã hủy',
        completed: true,
        icon: <XCircle size={16} color="#fff" />,
      },
    ]

    return (
      <View className="px-4 py-3">
        {steps.map((step, index) => (
          <View key={index} className="flex-row gap-3">
            <View className="items-center">
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: index === 1 ? colors.error : colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {step.icon}
              </View>
              {index < steps.length - 1 && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 24,
                    backgroundColor: colors.error,
                    marginVertical: 2,
                  }}
                />
              )}
            </View>
            <View style={{ paddingBottom: index < steps.length - 1 ? 16 : 0, flex: 1 }}>
              <AppText
                raw
                variant="bodySmall"
                weight="semibold"
                style={{ color: index === 1 ? colors.error : colors.foreground }}>
                {step.label}
              </AppText>
              {step.timestamp && (
                <AppText raw variant="labelSmall" color="muted" style={{ marginTop: 2 }}>
                  {new Date(step.timestamp).toLocaleString('vi-VN')}
                </AppText>
              )}
            </View>
          </View>
        ))}
      </View>
    )
  }

  if (status === ORDER_STATUS.RETURNED) {
    const steps: TimelineStep[] = [
      {
        label: 'Đặt hàng',
        timestamp: createdAt,
        completed: true,
        icon: <Clock size={16} color="#fff" />,
      },
      {
        label: 'Đã giao hàng',
        completed: true,
        icon: <Package size={16} color="#fff" />,
      },
      {
        label: 'Trả hàng',
        completed: true,
        icon: <RotateCcw size={16} color="#fff" />,
      },
    ]

    return (
      <View className="px-4 py-3">
        {steps.map((step, index) => (
          <View key={index} className="flex-row gap-3">
            <View className="items-center">
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: index === 2 ? colors.warning : colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {step.icon}
              </View>
              {index < steps.length - 1 && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 24,
                    backgroundColor: colors.primary,
                    marginVertical: 2,
                  }}
                />
              )}
            </View>
            <View style={{ paddingBottom: index < steps.length - 1 ? 16 : 0, flex: 1 }}>
              <AppText
                raw
                variant="bodySmall"
                weight="semibold"
                style={{ color: colors.foreground }}>
                {step.label}
              </AppText>
              {step.timestamp && (
                <AppText raw variant="labelSmall" color="muted" style={{ marginTop: 2 }}>
                  {new Date(step.timestamp).toLocaleString('vi-VN')}
                </AppText>
              )}
            </View>
          </View>
        ))}
      </View>
    )
  }

  // Normal flow: pending → confirmed → processing → shipping → delivered
  const statusOrder = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPING,
    ORDER_STATUS.DELIVERED,
  ]
  const currentIdx = statusOrder.indexOf(status as any)

  const steps: TimelineStep[] = [
    {
      label: 'Đặt hàng',
      timestamp: createdAt,
      completed: currentIdx >= 0,
      icon: <Clock size={16} color={currentIdx >= 0 ? '#fff' : colors.neutrals400} />,
    },
    {
      label: 'Đã xác nhận',
      completed: currentIdx >= 1,
      icon: <CheckCircle size={16} color={currentIdx >= 1 ? '#fff' : colors.neutrals400} />,
    },
    {
      label: 'Đang xử lý',
      completed: currentIdx >= 2,
      icon: <Package size={16} color={currentIdx >= 2 ? '#fff' : colors.neutrals400} />,
    },
    {
      label: 'Đang vận chuyển',
      completed: currentIdx >= 3,
      icon: <Truck size={16} color={currentIdx >= 3 ? '#fff' : colors.neutrals400} />,
    },
    {
      label: 'Đã giao hàng',
      completed: currentIdx >= 4,
      icon: <Package size={16} color={currentIdx >= 4 ? '#fff' : colors.neutrals400} />,
    },
  ]

  return (
    <View className="px-4 py-3">
      {steps.map((step, index) => (
        <View key={index} className="flex-row gap-3">
          {/* Icon + connector */}
          <View className="items-center">
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: step.completed ? colors.primary : colors.neutrals800,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {step.icon}
            </View>
            {index < steps.length - 1 && (
              <View
                style={{
                  width: 2,
                  flex: 1,
                  minHeight: 24,
                  backgroundColor: step.completed ? colors.primary : colors.neutrals800,
                  marginVertical: 2,
                }}
              />
            )}
          </View>

          {/* Content */}
          <View style={{ paddingBottom: index < steps.length - 1 ? 16 : 0, flex: 1 }}>
            <AppText
              raw
              variant="bodySmall"
              weight={step.completed ? 'semibold' : 'regular'}
              style={{ color: step.completed ? colors.foreground : colors.neutrals400 }}>
              {step.label}
            </AppText>
            {step.timestamp && (
              <AppText raw variant="labelSmall" color="muted" style={{ marginTop: 2 }}>
                {new Date(step.timestamp).toLocaleString('vi-VN')}
              </AppText>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}
