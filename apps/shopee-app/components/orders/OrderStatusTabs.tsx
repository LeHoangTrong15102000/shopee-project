import React from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

export type OrderStatusTab = 'all' | 'pending' | 'shipping' | 'delivered' | 'cancelled'

interface OrderStatusTabsProps {
  activeTab: OrderStatusTab
  onTabChange: (tab: OrderStatusTab) => void
}

export default function OrderStatusTabs({ activeTab, onTabChange }: OrderStatusTabsProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const tabs = [
    { label: t('orderCard.status.all'), value: 'all' as const },
    { label: t('orderCard.status.pending'), value: 'pending' as const },
    { label: t('orderCard.status.shipping'), value: 'shipping' as const },
    { label: t('orderCard.status.delivered'), value: 'delivered' as const },
    { label: t('orderCard.status.cancelled'), value: 'cancelled' as const },
  ]

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="border-b border-neutrals900"
      contentContainerStyle={{ paddingHorizontal: 8 }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value
        return (
          <TouchableOpacity
            key={tab.value}
            onPress={() => onTabChange(tab.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderBottomWidth: 2,
              borderBottomColor: isActive ? colors.primary : 'transparent',
              marginHorizontal: 4,
            }}>
            <AppText
              raw
              variant="bodySmall"
              weight={isActive ? 'semibold' : 'regular'}
              style={{ color: isActive ? colors.primary : colors.neutrals300 }}>
              {tab.label}
            </AppText>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

