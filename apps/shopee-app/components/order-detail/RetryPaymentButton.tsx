import React from 'react'
import { useTranslation } from 'react-i18next'
import { AppButton } from '@/components/ui'
import { useRetryPayment } from '@/hooks/useOrderPayment'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RetryPaymentButtonProps {
  orderId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Retry-payment action button for failed/expired orders.
 * Calls useRetryPayment which opens the returned paymentUrl via
 * expo-web-browser with Linking fallback — matching the checkout flow.
 */
export default function RetryPaymentButton({ orderId }: RetryPaymentButtonProps) {
  const { t } = useTranslation()
  const retryPayment = useRetryPayment()

  return (
    <AppButton
      variant="primary"
      onPress={() => retryPayment.mutate(orderId)}
      loading={retryPayment.isPending}
      className="w-full">
      {t('retryPayment.button.retry')}
    </AppButton>
  )
}
