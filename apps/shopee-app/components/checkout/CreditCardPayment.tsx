import { useState } from 'react'
import { useStripe } from '@stripe/stripe-react-native'
import { useRouter } from 'expo-router'
import { useToast } from '@/components/ui/ToastProvider'
import { createCreditCardOrder } from '@/apis/checkout.api'

interface CreditCardPaymentProps {
  purchaseIds: string[]
  shippingAddressId: string
  shippingMethodId: string
  voucherCode?: string
  coinsUsed?: number
  onProcessingChange: (isProcessing: boolean) => void
  onCancel?: () => void
}

/**
 * Handles the Stripe PaymentSheet flow for credit card payments.
 *
 * Flow:
 *   1. Call POST /checkout/create-order with payment_method: 'credit_card'
 *   2. Init PaymentSheet with the returned client_secret
 *   3. Present PaymentSheet to the user
 *   4. On success → navigate to payment-status with orderId
 *   5. On cancel → stay on checkout (no navigation)
 *   6. On error → show toast
 */
export async function presentCreditCardPayment({
  purchaseIds,
  shippingAddressId,
  shippingMethodId,
  voucherCode,
  coinsUsed,
  initPaymentSheet,
  presentPaymentSheet,
  router,
  showError,
  onProcessingChange,
}: {
  purchaseIds: string[]
  shippingAddressId: string
  shippingMethodId: string
  voucherCode?: string
  coinsUsed?: number
  initPaymentSheet: ReturnType<typeof useStripe>['initPaymentSheet']
  presentPaymentSheet: ReturnType<typeof useStripe>['presentPaymentSheet']
  router: ReturnType<typeof useRouter>
  showError: (title: string, message?: string) => string
  onProcessingChange: (isProcessing: boolean) => void
}) {
  onProcessingChange(true)
  try {
    // Step 1: Create order and get client_secret
    const response = await createCreditCardOrder({
      purchase_ids: purchaseIds,
      shipping_address_id: shippingAddressId,
      shipping_method_id: shippingMethodId,
      payment_method: 'credit_card',
      voucher_code: voucherCode,
      coins_used: coinsUsed,
    })

    const order = response?.data
    if (!order?._id || !order?.client_secret) {
      showError('Lỗi thanh toán', 'Không thể khởi tạo thanh toán. Vui lòng thử lại.')
      return
    }

    const orderId = order._id
    const clientSecret = order.client_secret

    // Step 2: Init PaymentSheet
    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Shopee',
      returnURL: 'shopeeapp://stripe-return',
    })

    if (initError) {
      showError('Lỗi thanh toán', initError.message)
      return
    }

    // Step 3: Present PaymentSheet
    const { error: presentError } = await presentPaymentSheet()

    if (presentError) {
      if (presentError.code === 'Canceled') {
        // User dismissed — stay on checkout, no navigation
        return
      }
      // Card declined, network error, 3DS failure, etc.
      showError('Thanh toán thất bại', presentError.message)
      return
    }

    // Step 4: Success — navigate to payment-status screen
    router.replace({ pathname: '/payment-status', params: { orderId } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không mong muốn'
    showError('Lỗi thanh toán', message)
  } finally {
    onProcessingChange(false)
  }
}

/**
 * Hook that returns a function to trigger the credit card PaymentSheet flow.
 * Use this in checkout.tsx instead of mounting a component.
 */
export function useCreditCardPayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const router = useRouter()
  const { showError } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const pay = async (params: Omit<CreditCardPaymentProps, 'onProcessingChange' | 'onCancel'>) => {
    await presentCreditCardPayment({
      ...params,
      initPaymentSheet,
      presentPaymentSheet,
      router,
      showError,
      onProcessingChange: setIsProcessing,
    })
  }

  return { pay, isProcessing }
}

export default function CreditCardPayment(_props: CreditCardPaymentProps) {
  // This component is intentionally empty — the payment flow is triggered
  // imperatively via useCreditCardPayment() hook from checkout.tsx.
  return null
}
