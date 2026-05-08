import React from 'react'
import { TouchableOpacity } from 'react-native'
import { AppText } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useCanReview } from '@/hooks/useCanReview'

interface OrderItemReviewButtonProps {
  purchaseId: string
  onPress: () => void
}

/**
 * Shows the "Review" button only when:
 * 1. The order is delivered (caller is responsible for only rendering this when isDelivered)
 * 2. The can-review API returns true for this purchase
 * The button is hidden (not just disabled) while the query is loading.
 */
export default function OrderItemReviewButton({ purchaseId, onPress }: OrderItemReviewButtonProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useCanReview(purchaseId)

  // Hidden while loading — prevents flash of button before query resolves
  if (isLoading) return null

  const canReview = data?.data?.can_review ?? false
  if (!canReview) return null

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mt-2 self-end rounded-lg border border-neutrals700 px-3 py-1.5"
      accessibilityRole="button">
      <AppText raw variant="bodySmall" color="primary">
        {t('orderDetail.actions.review')}
      </AppText>
    </TouchableOpacity>
  )
}
