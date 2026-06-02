import { useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { useToast } from '@/components/ui/ToastProvider'
import { initiateEWalletPayment } from '@/apis/checkout.api'

interface EWalletPaymentParams {
  purchaseIds: string[]
  shippingAddressId: string
  shippingMethodId: string
  provider: 'momo' | 'vnpay'
  voucherCode?: string
  coinsUsed?: number
  onProcessingChange: (isProcessing: boolean) => void
}

/**
 * Initiates an e-wallet payment session and opens the payment URL.
 *
 * Flow:
 *   1. Call POST /checkout/initiate-payment with return_url base
 *      The backend appends ?sessionId={sessionId} to the return_url base,
 *      so the provider redirects to shopeeapp://payment-return?sessionId=xxx
 *   2. Open payment_url via expo-web-browser (falls back to Linking)
 *   3. Deep link return is handled by the deep link handler in _layout.tsx
 *      which navigates to /payment-status?sessionId=xxx
 */
export async function initiateEWalletFlow({
  purchaseIds,
  shippingAddressId,
  shippingMethodId,
  provider,
  voucherCode,
  coinsUsed,
  showError,
  onProcessingChange,
}: Omit<EWalletPaymentParams, 'onProcessingChange'> & {
  showError: (title: string, message?: string) => string
  onProcessingChange: (isProcessing: boolean) => void
}) {
  onProcessingChange(true)
  try {
    // Pass the return_url base — the backend appends ?sessionId={sessionId}
    // so the provider redirects to shopeeapp://payment-return?sessionId=xxx
    const returnUrlBase = 'shopeeapp://payment-return'

    const response = await initiateEWalletPayment({
      purchase_ids: purchaseIds,
      shipping_address_id: shippingAddressId,
      shipping_method_id: shippingMethodId,
      e_wallet_provider: provider,
      return_url: returnUrlBase,
      voucher_code: voucherCode,
      coins_used: coinsUsed,
    })

    const session = response?.data
    if (!session?.sessionId || !session?.payment_url) {
      showError('Lỗi thanh toán', 'Không thể khởi tạo thanh toán. Vui lòng thử lại.')
      return
    }

    const { payment_url } = session

    // Open payment URL via expo-web-browser
    // Falls back to in-app browser if native e-wallet app is not installed
    try {
      await WebBrowser.openBrowserAsync(payment_url, {
        dismissButtonStyle: 'cancel',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      })
    } catch {
      // expo-web-browser failed — try Linking as last resort
      const { Linking } = await import('react-native')
      const canOpen = await Linking.canOpenURL(payment_url)
      if (canOpen) {
        await Linking.openURL(payment_url)
      } else {
        showError('Không thể mở ứng dụng thanh toán', 'Vui lòng chọn phương thức thanh toán khác.')
      }
    }

    // Navigation to payment-status happens via deep link handler when the
    // e-wallet app redirects back to shopeeapp://payment-return?sessionId=...
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không mong muốn'
    showError('Lỗi thanh toán', message)
  } finally {
    onProcessingChange(false)
  }
}

/**
 * Hook that returns a function to trigger the e-wallet payment flow.
 */
export function useEWalletPayment() {
  const { showError } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const pay = async (params: Omit<EWalletPaymentParams, 'onProcessingChange'>) => {
    await initiateEWalletFlow({
      ...params,
      showError,
      onProcessingChange: setIsProcessing,
    })
  }

  return { pay, isProcessing }
}

export default function EWalletPayment(_props: EWalletPaymentParams) {
  // Intentionally empty — flow is triggered imperatively via useEWalletPayment()
  return null
}
