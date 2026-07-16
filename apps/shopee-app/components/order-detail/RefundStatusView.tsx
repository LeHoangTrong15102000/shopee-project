import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { FileQuestion } from 'lucide-react-native'
import { AppText, AppButton } from '@/components/ui'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { useColors } from '@/hooks/useColors'
import { useRefundStatus, useCancelRefund } from '@/hooks/useRefund'
import { type RefundStatus } from '@/apis/refund.api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefundStatusViewProps {
  orderId: string
  onRequestRefund?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'

const STATUS_BADGE: Record<RefundStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'primary',
  REJECTED: 'error',
  PROCESSING: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'default',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RefundStatusView({ orderId, onRequestRefund }: RefundStatusViewProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const { data: refund, isLoading, isError } = useRefundStatus(orderId)
  const cancelRefund = useCancelRefund(orderId)

  if (isLoading) {
    return (
      <View style={{ padding: 24, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  // On error or no refund — show empty state with option to request
  if (isError || !refund) {
    return (
      <EmptyState
        icon={FileQuestion}
        message={t('refund.status.empty')}
        actionLabel={onRequestRefund ? t('refund.status.requestAction') : undefined}
        onAction={onRequestRefund}
      />
    )
  }

  const badgeVariant = STATUS_BADGE[refund.status] ?? 'default'

  return (
    <View style={{ gap: 12 }}>
      {/* Header row: title + status badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText raw variant="bodySmall" weight="semibold">
          {t('refund.status.title')}
        </AppText>
        <Badge variant={badgeVariant} size="sm">
          {t(`refund.status.${refund.status}`)}
        </Badge>
      </View>

      {/* Reason */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText raw variant="labelSmall" color="muted">
          {t('refund.form.reason')}
        </AppText>
        <AppText raw variant="labelSmall">
          {t(`refund.reason.${refund.reason}`)}
        </AppText>
      </View>

      {/* Requested amount */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText raw variant="labelSmall" color="muted">
          {t('refund.form.amount')}
        </AppText>
        <AppText raw variant="labelSmall">
          {refund.requested_amount.toLocaleString()}
        </AppText>
      </View>

      {/* Approved amount (shown when approved/completed) */}
      {refund.approved_amount !== undefined && refund.approved_amount !== null && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText raw variant="labelSmall" color="muted">
            {t('refund.status.approvedAmount')}
          </AppText>
          <AppText raw variant="labelSmall" color="success">
            {refund.approved_amount.toLocaleString()}
          </AppText>
        </View>
      )}

      {/* Rejection reason (shown when rejected) */}
      {refund.status === 'REJECTED' && refund.rejection_reason && (
        <View style={{ gap: 2 }}>
          <AppText raw variant="labelSmall" color="muted">
            {t('refund.status.rejectionReason')}
          </AppText>
          <AppText raw variant="labelSmall" color="error">
            {refund.rejection_reason}
          </AppText>
        </View>
      )}

      {/* Cancel button — only for PENDING refunds */}
      {refund.status === 'PENDING' && (
        <AppButton
          variant="outline"
          size="sm"
          onPress={() => cancelRefund.mutate()}
          loading={cancelRefund.isPending}
          className="w-full">
          {t('refund.status.cancelAction')}
        </AppButton>
      )}
    </View>
  )
}
