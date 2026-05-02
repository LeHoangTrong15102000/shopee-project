import React from 'react'
import { View } from 'react-native'
import { CheckCircle, Clock, Package, Truck, XCircle, RotateCcw } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useAppStore } from '@/store/appStore'
import { ORDER_STATUS, type OrderStatusType } from '@/constants/order'

interface TimelineStep {
  label: string
  timestamp?: string
  completed: boolean
  icon: React.ReactNode
  /** Optional override for icon background color */
  iconBg?: string
  /** Optional override for text color */
  textColor?: string
  /** Connector line color override */
  connectorColor?: string
}

interface OrderTimelineProps {
  status: string
  createdAt?: string
}

function StepList({ steps, colors }: { steps: TimelineStep[]; colors: ReturnType<typeof useColors> }) {
  const language = useAppStore((state) => state.language)
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'

  return (
    <View className="px-4 py-3">
      {steps.map((step, index) => {
        const iconBg = step.iconBg ?? (step.completed ? colors.primary : colors.neutrals800)
        const connectorBg = step.connectorColor ?? (step.completed ? colors.primary : colors.neutrals800)
        const textColor = step.textColor ?? (step.completed ? colors.foreground : colors.neutrals400)

        return (
          <View key={index} className="flex-row gap-3">
            <View className="items-center">
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: iconBg,
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
                    backgroundColor: connectorBg,
                    marginVertical: 2,
                  }}
                />
              )}
            </View>
            <View style={{ paddingBottom: index < steps.length - 1 ? 16 : 0, flex: 1 }}>
              <AppText
                raw
                variant="bodySmall"
                weight={step.completed ? 'semibold' : 'regular'}
                style={{ color: textColor }}>
                {step.label}
              </AppText>
              {step.timestamp && (
                <AppText raw variant="labelSmall" color="muted" style={{ marginTop: 2 }}>
                  {new Date(step.timestamp).toLocaleString(locale)}
                </AppText>
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}

export default function OrderTimeline({ status, createdAt }: OrderTimelineProps) {
  const { t } = useTranslation()
  const colors = useColors()

  if (status === ORDER_STATUS.CANCELLED) {
    const steps: TimelineStep[] = [
      {
        label: t('orderTimeline.step.placed'),
        timestamp: createdAt,
        completed: true,
        icon: <Clock size={16} color={colors.primaryForeground} />,
      },
      {
        label: t('orderTimeline.step.cancelled'),
        completed: true,
        icon: <XCircle size={16} color={colors.primaryForeground} />,
        iconBg: colors.error,
        textColor: colors.error,
        connectorColor: colors.error,
      },
    ]
    return <StepList steps={steps} colors={colors} />
  }

  if (status === ORDER_STATUS.RETURNED) {
    const steps: TimelineStep[] = [
      {
        label: t('orderTimeline.step.placed'),
        timestamp: createdAt,
        completed: true,
        icon: <Clock size={16} color={colors.primaryForeground} />,
      },
      {
        label: t('orderTimeline.step.delivered'),
        completed: true,
        icon: <Package size={16} color={colors.primaryForeground} />,
      },
      {
        label: t('orderTimeline.step.returned'),
        completed: true,
        icon: <RotateCcw size={16} color={colors.primaryForeground} />,
        iconBg: colors.warning,
      },
    ]
    return <StepList steps={steps} colors={colors} />
  }

  // Normal flow: pending → confirmed → processing → shipping → delivered
  const statusOrder = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPING,
    ORDER_STATUS.DELIVERED,
  ]
  const currentIdx = statusOrder.indexOf(status as OrderStatusType)

  const steps: TimelineStep[] = [
    {
      label: t('orderTimeline.step.placed'),
      timestamp: createdAt,
      completed: currentIdx >= 0,
      icon: <Clock size={16} color={currentIdx >= 0 ? colors.primaryForeground : colors.neutrals400} />,
    },
    {
      label: t('orderTimeline.step.confirmed'),
      completed: currentIdx >= 1,
      icon: <CheckCircle size={16} color={currentIdx >= 1 ? colors.primaryForeground : colors.neutrals400} />,
    },
    {
      label: t('orderTimeline.step.processing'),
      completed: currentIdx >= 2,
      icon: <Package size={16} color={currentIdx >= 2 ? colors.primaryForeground : colors.neutrals400} />,
    },
    {
      label: t('orderTimeline.step.shipping'),
      completed: currentIdx >= 3,
      icon: <Truck size={16} color={currentIdx >= 3 ? colors.primaryForeground : colors.neutrals400} />,
    },
    {
      label: t('orderTimeline.step.delivered'),
      completed: currentIdx >= 4,
      icon: <Package size={16} color={currentIdx >= 4 ? colors.primaryForeground : colors.neutrals400} />,
    },
  ]

  return <StepList steps={steps} colors={colors} />
}
