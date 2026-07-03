import React from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppButton } from '@/components/ui'
import { ORDER_STATUS } from '@/constants/order'

interface OrderActionsProps {
  status: string
  onCancel: () => void
  onConfirmReceived: () => void
  onReturn: () => void
  isCancelling?: boolean
  isConfirming?: boolean
}

export default function OrderActions({
  status,
  onCancel,
  onConfirmReceived,
  onReturn,
  isCancelling,
  isConfirming,
}: OrderActionsProps) {
  const { t } = useTranslation()

  const canCancel = status === ORDER_STATUS.PENDING || status === ORDER_STATUS.CONFIRMED
  const canConfirmReceived = status === ORDER_STATUS.SHIPPING
  const canReturn = status === ORDER_STATUS.DELIVERED

  if (!canCancel && !canConfirmReceived && !canReturn) return null

  return (
    <View className="gap-2 px-4 py-4">
      {canCancel && (
        <AppButton variant="outline" onPress={onCancel} loading={isCancelling} className="w-full">
          {t('orderDetail.button.cancel')}
        </AppButton>
      )}
      {canConfirmReceived && (
        <AppButton
          variant="primary"
          onPress={onConfirmReceived}
          loading={isConfirming}
          className="w-full">
          {t('orderDetail.button.confirmReceived')}
        </AppButton>
      )}
      {canReturn && (
        <AppButton variant="outline" onPress={onReturn} className="w-full">
          {t('orderDetail.actions.return')}
        </AppButton>
      )}
    </View>
  )
}
