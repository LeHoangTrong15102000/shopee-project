import { useTranslation } from 'react-i18next'

interface PaymentStatusBadgeProps {
  paymentStatus: string | undefined
  paymentMethod: string | undefined
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

type PaymentStatusKey =
  | 'paymentStatus.pending'
  | 'paymentStatus.processing'
  | 'paymentStatus.paid'
  | 'paymentStatus.failed'
  | 'paymentStatus.refunded'

const PAYMENT_STATUS_I18N_KEYS: Record<string, PaymentStatusKey> = {
  pending: 'paymentStatus.pending',
  processing: 'paymentStatus.processing',
  paid: 'paymentStatus.paid',
  failed: 'paymentStatus.failed',
  refunded: 'paymentStatus.refunded',
}

/**
 * Displays a payment status badge for credit card orders.
 * Returns null for non-credit-card payment methods (COD, bank transfer, e-wallet).
 */
function PaymentStatusBadge({ paymentStatus, paymentMethod }: PaymentStatusBadgeProps) {
  const { t } = useTranslation('order')

  if (paymentMethod !== 'credit_card') return null
  if (!paymentStatus) return null

  const colorClass = PAYMENT_STATUS_COLORS[paymentStatus]
  const i18nKey = PAYMENT_STATUS_I18N_KEYS[paymentStatus]
  if (!colorClass || !i18nKey) return null

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {t(i18nKey)}
    </span>
  )
}

export default PaymentStatusBadge
