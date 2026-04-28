import React from 'react'
import { View } from 'react-native'
import { ShoppingCart } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui'

interface EmptyCartProps {
  onShopNow: () => void
}

export default function EmptyCart({ onShopNow }: EmptyCartProps) {
  const { t } = useTranslation()

  return (
    <View className="flex-1 items-center justify-center">
      <EmptyState
        icon={ShoppingCart}
        message={t('cart.empty.message')}
        actionLabel={t('cart.empty.action')}
        onAction={onShopNow}
      />
    </View>
  )
}
