import React from 'react'
import { View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { type LoyaltyReward } from '@/apis/xu.api'

interface RewardCardProps {
  reward: LoyaltyReward
  userBalance: number
  onRedeem: (rewardId: string) => void
  isRedeeming?: boolean
}

export default function RewardCard({ reward, userBalance, onRedeem, isRedeeming }: RewardCardProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const isOutOfStock = reward.stock <= 0
  const canAfford = userBalance >= reward.points_required
  const disabled = isOutOfStock || !canAfford || isRedeeming

  const handlePress = () => {
    Alert.alert(
      t('loyalty.rewards.confirmTitle'),
      t('loyalty.rewards.confirmMessage', { points: reward.points_required, name: reward.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('loyalty.rewards.redeem'), onPress: () => onRedeem(reward._id) },
      ]
    )
  }

  return (
    <View
      className="mx-4 my-1 rounded-lg border border-neutrals900 p-4"
      style={{ opacity: disabled && !isRedeeming ? 0.6 : 1 }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <AppText raw variant="body" weight="semibold" numberOfLines={2}>
            {reward.name}
          </AppText>
          {reward.description ? (
            <AppText raw variant="bodySmall" color="muted" className="mt-1" numberOfLines={3}>
              {reward.description}
            </AppText>
          ) : null}
          <AppText raw variant="labelSmall" style={{ color: colors.coin, marginTop: 6 }}>
            {t('loyalty.rewards.pointsRequired', { points: reward.points_required })}
          </AppText>
          {isOutOfStock && (
            <AppText raw variant="labelSmall" color="error" className="mt-1">
              {t('loyalty.rewards.outOfStock')}
            </AppText>
          )}
        </View>

        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('loyalty.rewards.redeem')}
          accessibilityState={{ disabled }}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: disabled ? colors.neutrals800 : colors.primary,
          }}>
          {isRedeeming ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <AppText
              raw
              variant="labelSmall"
              weight="semibold"
              style={{ color: disabled ? colors.neutrals400 : colors.primaryForeground }}>
              {t('loyalty.rewards.redeem')}
            </AppText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}
