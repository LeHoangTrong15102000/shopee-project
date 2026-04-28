import React from 'react'
import { View, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Tag } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, Badge } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { formatPrice } from '@/utils/price'

interface Voucher {
  _id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_spend?: number
  expire_date?: string
  is_saved?: boolean
  is_expired?: boolean
  is_used?: boolean
}

interface VoucherCardProps {
  voucher: Voucher
  onCollect?: (id: string) => void
  isCollecting?: boolean
  showActions?: boolean
}

export default function VoucherCard({
  voucher,
  onCollect,
  isCollecting,
  showActions = false,
}: VoucherCardProps) {
  const colors = useColors()
  const { t, i18n } = useTranslation()
  const isExpiredOrUsed = voucher.is_expired || voucher.is_used

  const discountText =
    voucher.discount_type === 'percent'
      ? t('voucherCard.discount.percent', { value: voucher.discount_value })
      : t('voucherCard.discount.fixed', { value: formatPrice(voucher.discount_value) })

  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US'
  const expiryDate = voucher.expire_date
    ? new Date(voucher.expire_date).toLocaleDateString(locale)
    : null

  return (
    <View
      className="flex-row rounded-lg border border-neutrals900 overflow-hidden mx-4 my-1"
      style={{ opacity: isExpiredOrUsed ? 0.5 : 1 }}>
      {/* Left accent bar */}
      <View
        style={{
          width: 6,
          backgroundColor: isExpiredOrUsed ? colors.neutrals600 : colors.primary,
        }}
      />

      {/* Content */}
      <View className="flex-1 flex-row items-center px-3 py-3 gap-3">
        <Tag size={24} color={isExpiredOrUsed ? colors.neutrals400 : colors.primary} />

        <View className="flex-1">
          <AppText raw variant="body" weight="semibold">
            {discountText}
          </AppText>
          {voucher.min_spend && voucher.min_spend > 0 && (
            <AppText raw variant="labelSmall" color="muted">
              {t('voucherCard.minSpend', { amount: formatPrice(voucher.min_spend) })}
            </AppText>
          )}
          {expiryDate && (
            <AppText raw variant="labelSmall" color="muted">
              {t('voucherCard.expiry', { date: expiryDate })}
            </AppText>
          )}
          {(voucher.is_expired || voucher.is_used) && (
            <View style={{ marginTop: 4 }}>
              <Badge variant="error" size="sm">
                {voucher.is_used
                  ? t('voucherCard.status.used')
                  : t('voucherCard.status.expired')}
              </Badge>
            </View>
          )}
        </View>

        {/* Collect button shown on available tab */}
        {showActions && !isExpiredOrUsed && (
          <TouchableOpacity
            onPress={() => !voucher.is_saved && onCollect?.(voucher._id)}
            disabled={voucher.is_saved || isCollecting}
            accessibilityRole="button"
            accessibilityLabel={
              voucher.is_saved ? t('voucherCard.button.saved') : t('voucherCard.button.save')
            }
            accessibilityState={{ disabled: voucher.is_saved || isCollecting }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: voucher.is_saved ? colors.neutrals600 : colors.primary,
              backgroundColor: voucher.is_saved ? 'transparent' : undefined,
            }}>
            {isCollecting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <AppText
                raw
                variant="labelSmall"
                style={{ color: voucher.is_saved ? colors.neutrals400 : colors.primary }}>
                {voucher.is_saved ? t('voucherCard.button.saved') : t('voucherCard.button.save')}
              </AppText>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
