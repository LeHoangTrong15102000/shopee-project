import React from 'react'
import { View } from 'react-native'
import { ShoppingBag } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui'

interface EmptyOrderStateProps {
  message?: string
}

export default function EmptyOrderState({ message }: EmptyOrderStateProps) {
  const { t } = useTranslation()

  return (
    <View className="flex-1 items-center justify-center">
      <EmptyState
        icon={ShoppingBag}
        message={message ?? t('orders.empty.message')}
      />
    </View>
  )
}
