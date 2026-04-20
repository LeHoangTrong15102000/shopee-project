import React from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

export type OrderStatusTab = 'all' | 'pending' | 'shipping' | 'delivered' | 'cancelled'

const TABS: { label: string; value: OrderStatusTab }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ xác nhận', value: 'pending' },
  { label: 'Đang giao', value: 'shipping' },
  { label: 'Đã giao', value: 'delivered' },
  { label: 'Đã hủy', value: 'cancelled' },
]

interface OrderStatusTabsProps {
  activeTab: OrderStatusTab
  onTabChange: (tab: OrderStatusTab) => void
}

export default function OrderStatusTabs({ activeTab, onTabChange }: OrderStatusTabsProps) {
  const colors = useColors()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="border-b border-neutrals900"
      contentContainerStyle={{ paddingHorizontal: 8 }}>
      {TABS.map((tab) => {
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
