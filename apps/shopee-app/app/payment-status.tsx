import React, { useEffect, useRef, useState, useCallback } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { CheckCircle, XCircle, Clock } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { getOrderPaymentStatus, getSessionStatus } from '@/apis/checkout.api'
import { getSocket } from '@/store/chatStore'

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentState = 'processing' | 'success' | 'failed' | 'timeout'

const POLL_INTERVAL_MS = 3000
const TIMEOUT_MS = 60000

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaymentStatusScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { orderId, sessionId } = useLocalSearchParams<{
    orderId?: string
    sessionId?: string
  }>()

  const [state, setState] = useState<PaymentState>('processing')
  const [resolvedOrderId, setResolvedOrderId] = useState<string | undefined>(orderId)
  const [failureReason, setFailureReason] = useState<string | undefined>()

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTerminalRef = useRef(false)

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current)
      timeoutTimerRef.current = null
    }
  }, [])

  const transitionTo = useCallback(
    (nextState: PaymentState, oid?: string, reason?: string) => {
      if (isTerminalRef.current) return
      isTerminalRef.current = true
      stopPolling()
      if (oid) setResolvedOrderId(oid)
      if (reason) setFailureReason(reason)
      setState(nextState)
    },
    [stopPolling],
  )

  // ─── Polling ────────────────────────────────────────────────────────────────

  const pollOrderStatus = useCallback(async () => {
    if (!orderId || isTerminalRef.current) return
    try {
      const res = await getOrderPaymentStatus(orderId)
      const status = res?.data?.status
      if (status === 'SUCCESS') {
        transitionTo('success', orderId)
      } else if (status === 'FAILED') {
        transitionTo('failed', undefined, res?.data?.failure_reason)
      }
    } catch {
      // Network error — keep polling
    }
  }, [orderId, transitionTo])

  const pollSessionStatus = useCallback(async () => {
    if (!sessionId || isTerminalRef.current) return
    try {
      const res = await getSessionStatus(sessionId)
      const data = res?.data
      if (data?.status === 'PAID') {
        transitionTo('success', data.orderId)
      } else if (data?.status === 'FAILED' || data?.status === 'EXPIRED') {
        transitionTo('failed', undefined, data?.failure_reason)
      }
    } catch {
      // Network error — keep polling
    }
  }, [sessionId, transitionTo])

  // ─── WebSocket listener ──────────────────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handlePaymentUpdate = (payload: {
      orderId: string
      payment_status: 'paid' | 'failed'
    }) => {
      if (isTerminalRef.current) return
      // Match by orderId if we have one, or accept any update when using sessionId
      const isRelevant = orderId
        ? payload.orderId === orderId
        : !resolvedOrderId || payload.orderId === resolvedOrderId

      if (!isRelevant) return

      if (payload.payment_status === 'paid') {
        transitionTo('success', payload.orderId)
      } else if (payload.payment_status === 'failed') {
        transitionTo('failed')
      }
    }

    socket.on('payment:status_updated', handlePaymentUpdate)
    return () => {
      socket.off('payment:status_updated', handlePaymentUpdate)
    }
  }, [orderId, resolvedOrderId, transitionTo])

  // ─── Start polling + timeout ─────────────────────────────────────────────────

  useEffect(() => {
    if (!orderId && !sessionId) return

    const pollFn = orderId ? pollOrderStatus : pollSessionStatus

    // Run immediately, then on interval
    pollFn()
    pollTimerRef.current = setInterval(pollFn, POLL_INTERVAL_MS)

    // 60-second timeout
    timeoutTimerRef.current = setTimeout(() => {
      if (!isTerminalRef.current) {
        transitionTo('timeout')
      }
    }, TIMEOUT_MS)

    return () => {
      stopPolling()
    }
  }, [orderId, sessionId, pollOrderStatus, pollSessionStatus, transitionTo, stopPolling])

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center px-8">
          {state === 'processing' && <ProcessingView colors={colors} t={t} />}
          {state === 'success' && (
            <SuccessView colors={colors} t={t} orderId={resolvedOrderId} router={router} />
          )}
          {state === 'failed' && <FailureView colors={colors} t={t} router={router} reason={failureReason} />}
          {state === 'timeout' && <TimeoutView colors={colors} t={t} router={router} />}
        </View>
      </SafeAreaView>
    </>
  )
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

function ProcessingView({
  colors,
  t,
}: {
  colors: ReturnType<typeof useColors>
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <View className="items-center gap-6">
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText raw variant="heading3" weight="semibold" style={{ textAlign: 'center' }}>
        {t('paymentStatus.processing.title', 'Đang xử lý thanh toán...')}
      </AppText>
      <AppText raw variant="bodySmall" color="muted" style={{ textAlign: 'center' }}>
        {t('paymentStatus.processing.subtitle', 'Vui lòng không đóng ứng dụng')}
      </AppText>
    </View>
  )
}

function SuccessView({
  colors,
  t,
  orderId,
  router,
}: {
  colors: ReturnType<typeof useColors>
  t: ReturnType<typeof useTranslation>['t']
  orderId?: string
  router: ReturnType<typeof useRouter>
}) {
  return (
    <View className="items-center w-full gap-4">
      <CheckCircle size={80} color={colors.success} />

      <AppText
        raw
        variant="heading2"
        weight="bold"
        style={{ marginTop: 8, marginBottom: 4, textAlign: 'center' }}>
        {t('paymentStatus.success.title', 'Thanh toán thành công!')}
      </AppText>

      {orderId && (
        <AppText raw variant="bodySmall" color="muted" style={{ textAlign: 'center' }}>
          {t('paymentStatus.success.orderId', {
            orderId: orderId.slice(-8).toUpperCase(),
            defaultValue: `Mã đơn hàng: ${orderId.slice(-8).toUpperCase()}`,
          })}
        </AppText>
      )}

      <View className="w-full gap-3" style={{ marginTop: 16 }}>
        {orderId && (
          <AppButton
            variant="primary"
            onPress={() => router.push({ pathname: '/order/[id]', params: { id: orderId } })}
            className="w-full">
            {t('paymentStatus.success.viewOrder', 'Xem đơn hàng')}
          </AppButton>
        )}
        <AppButton
          variant="outline"
          onPress={() => router.replace('/(tabs)/home')}
          className="w-full">
          {t('paymentStatus.success.continueShopping', 'Tiếp tục mua sắm')}
        </AppButton>
      </View>
    </View>
  )
}

function FailureView({
  colors,
  t,
  router,
  reason,
}: {
  colors: ReturnType<typeof useColors>
  t: ReturnType<typeof useTranslation>['t']
  router: ReturnType<typeof useRouter>
  reason?: string
}) {
  return (
    <View className="items-center w-full gap-4">
      <XCircle size={80} color={colors.error ?? colors.primary} />

      <AppText
        raw
        variant="heading2"
        weight="bold"
        style={{ marginTop: 8, marginBottom: 4, textAlign: 'center' }}>
        {t('paymentStatus.failed.title', 'Thanh toán thất bại')}
      </AppText>

      <AppText raw variant="bodySmall" color="muted" style={{ textAlign: 'center' }}>
        {reason
          ? reason
          : t(
              'paymentStatus.failed.subtitle',
              'Đơn hàng chưa được xử lý. Vui lòng thử lại hoặc chọn phương thức khác.',
            )}
      </AppText>

      <View className="w-full gap-3" style={{ marginTop: 16 }}>
        <AppButton variant="primary" onPress={() => router.back()} className="w-full">
          {t('paymentStatus.failed.tryAgain', 'Thử lại')}
        </AppButton>
        <AppButton variant="outline" onPress={() => router.back()} className="w-full">
          {t('paymentStatus.failed.changeMethod', 'Đổi phương thức thanh toán')}
        </AppButton>
      </View>
    </View>
  )
}

function TimeoutView({
  colors,
  t,
  router,
}: {
  colors: ReturnType<typeof useColors>
  t: ReturnType<typeof useTranslation>['t']
  router: ReturnType<typeof useRouter>
}) {
  return (
    <View className="items-center w-full gap-4">
      <Clock size={80} color={colors.warning ?? colors.primary} />

      <AppText
        raw
        variant="heading2"
        weight="bold"
        style={{ marginTop: 8, marginBottom: 4, textAlign: 'center' }}>
        {t('paymentStatus.timeout.title', 'Đang xử lý')}
      </AppText>

      <AppText raw variant="body" style={{ textAlign: 'center' }}>
        {t(
          'paymentStatus.timeout.message',
          'Thanh toán đang được xử lý. Bạn sẽ nhận được thông báo khi hoàn tất.',
        )}
      </AppText>

      <View className="w-full gap-3" style={{ marginTop: 16 }}>
        <AppButton
          variant="outline"
          onPress={() => router.replace('/(tabs)/home')}
          className="w-full">
          {t('paymentStatus.timeout.goHome', 'Về trang chủ')}
        </AppButton>
      </View>
    </View>
  )
}
