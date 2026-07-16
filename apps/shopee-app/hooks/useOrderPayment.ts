import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import { retryOrderPayment, getOrderPaymentStatus } from '@/apis/order.api'
import { toast } from '@/utils/toast'
import { handleMutationError } from '@/utils/mutationErrorHandler'
import { orderKeys } from '@/hooks/useOrders'

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Polling interval for payment status: 4 seconds.
 * Rate limit is 20 req/min (= one every 3 s). 4 s keeps well under the limit.
 */
const PAYMENT_STATUS_INTERVAL = 4_000

/** Statuses that mean payment has reached a terminal state. */
const RESOLVED_STATUSES = new Set(['SUCCESS', 'FAILED'])

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const paymentStatusKeys = {
  status: (orderId: string) => ['order-payment-status', orderId] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Retry a failed/expired order payment.
 * Opens the returned paymentUrl via expo-web-browser (falls back to Linking),
 * matching the checkout flow pattern in EWalletPayment.tsx.
 */
export function useRetryPayment() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => retryOrderPayment(orderId),
    onSuccess: async (result, orderId) => {
      const { paymentUrl } = result
      // Invalidate payment status so the poller picks up new state
      queryClient.invalidateQueries({ queryKey: paymentStatusKeys.status(orderId) })

      try {
        await WebBrowser.openBrowserAsync(paymentUrl, {
          dismissButtonStyle: 'cancel',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        })
      } catch {
        // expo-web-browser failed — fall back to Linking
        const canOpen = await Linking.canOpenURL(paymentUrl)
        if (canOpen) {
          await Linking.openURL(paymentUrl)
        } else {
          toast.error(t('retryPayment.error.cannotOpen'))
        }
      }
    },
    onError: handleMutationError,
  })
}

/**
 * Poll the payment status for an order.
 * Polling starts when enabled=true and stops automatically when a terminal
 * status is reached (SUCCESS or FAILED) or when the component unmounts.
 * Conservative interval (4 s) stays well under the 20 req/min rate limit.
 */
export function useOrderPaymentStatus(orderId: string, enabled = true) {
  const queryClient = useQueryClient()
  const stoppedRef = useRef(false)

  const query = useQuery({
    queryKey: paymentStatusKeys.status(orderId),
    queryFn: () => getOrderPaymentStatus(orderId),
    enabled: enabled && !!orderId && !stoppedRef.current,
    refetchInterval: (data) => {
      // Stop polling once a terminal status is reached
      const status = data?.state?.data?.status
      if (status && RESOLVED_STATUSES.has(status)) {
        stoppedRef.current = true
        return false
      }
      return PAYMENT_STATUS_INTERVAL
    },
  })

  // Reset stopped flag when orderId changes so a new poll cycle can start
  useEffect(() => {
    stoppedRef.current = false
  }, [orderId])

  // Invalidate order detail when payment resolves so the UI reflects new status
  useEffect(() => {
    const status = query.data?.status
    if (status && RESOLVED_STATUSES.has(status)) {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
    }
  }, [query.data?.status, orderId, queryClient])

  return query
}
