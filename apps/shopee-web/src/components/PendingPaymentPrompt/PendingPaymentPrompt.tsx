import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { useMutation } from '@tanstack/react-query'
import { StripeCardForm } from 'src/components/StripeCardForm'
import orderApi from 'src/apis/order.api'
import { Order } from 'src/types/checkout.type'
import { formatCurrency } from 'src/utils/utils'

interface PendingPaymentPromptProps {
  pendingOrder: Order
  onPaymentSuccess: (orderId: string) => void
  onCancelSuccess: () => void
}

export function PendingPaymentPrompt({
  pendingOrder,
  onPaymentSuccess,
  onCancelSuccess,
}: PendingPaymentPromptProps) {
  const { t } = useTranslation('checkout')
  const stripe = useStripe()
  const elements = useElements()
  const [isConfirming, setIsConfirming] = useState(false)
  const [showExpiredHint, setShowExpiredHint] = useState(false)

  const cancelMutation = useMutation({
    mutationFn: () => orderApi.cancelOrder(pendingOrder._id),
    onSuccess: () => {
      toast.success(t('recovery.cancelSuccess'))
      onCancelSuccess()
    },
    onError: () => {
      toast.error(t('recovery.cancelError'))
    },
  })

  const handleResume = async () => {
    if (!stripe || !elements) {
      toast.error(t('recovery.stripeNotReady'))
      return
    }
    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast.error(t('recovery.cardNotReady'))
      return
    }
    if (!pendingOrder.stripe_client_secret) {
      toast.error(t('recovery.expiredError'))
      setShowExpiredHint(true)
      return
    }

    setIsConfirming(true)
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      pendingOrder.stripe_client_secret,
      { payment_method: { card: cardElement } },
    )
    setIsConfirming(false)

    if (error) {
      if (error.code === 'payment_intent_unexpected_state' || error.code === 'resource_missing') {
        toast.error(t('recovery.expiredError'))
        setShowExpiredHint(true)
      } else {
        toast.error(error.message ?? t('recovery.paymentFailed'))
      }
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      onPaymentSuccess(pendingOrder._id)
    }
  }

  const isBusy = isConfirming || cancelMutation.isPending

  return (
    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 text-2xl" aria-hidden="true">
          &#9888;&#65039;
        </span>
        <div>
          <h2 className="text-base font-semibold text-yellow-900">{t('recovery.title')}</h2>
          <p className="mt-1 text-sm text-yellow-700">
            {t('recovery.subtitle', {
              amount: formatCurrency(pendingOrder.total),
            })}
          </p>
        </div>
      </div>

      {/* Card form for recovery */}
      <StripeCardForm disabled={isBusy} />

      {/* Expired hint */}
      {showExpiredHint && (
        <p className="mt-3 text-sm font-medium text-red-600">{t('recovery.expiredHint')}</p>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={handleResume}
          disabled={isBusy}
          className="flex-1 rounded-lg bg-[#ee4d2d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d73211] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConfirming ? t('recovery.confirming') : t('recovery.resume')}
        </button>
        <button
          onClick={() => cancelMutation.mutate()}
          disabled={isBusy}
          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            showExpiredHint
              ? 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {cancelMutation.isPending ? t('recovery.cancelling') : t('recovery.cancel')}
        </button>
      </div>
    </div>
  )
}

PendingPaymentPrompt.displayName = 'PendingPaymentPrompt'
