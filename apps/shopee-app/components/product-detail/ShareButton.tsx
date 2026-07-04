import React from 'react'
import { TouchableOpacity, ActivityIndicator } from 'react-native'
import { Share2 } from 'lucide-react-native'
import { useColors } from '@/hooks/useColors'
import { useTranslation } from 'react-i18next'
import { useShareProduct } from '@/hooks/useProductRecommendations'

interface ShareButtonProps {
  productId: string
}

export default function ShareButton({ productId }: ShareButtonProps) {
  const colors = useColors()
  const { t } = useTranslation()
  const share = useShareProduct(productId)

  return (
    <TouchableOpacity
      onPress={() => share.mutate()}
      disabled={share.isPending}
      accessibilityRole="button"
      accessibilityLabel={t('PD_SHARE_ACTION')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className="items-center justify-center rounded-full bg-background/70 p-2">
      {share.isPending ? (
        <ActivityIndicator size="small" color={colors.foreground} />
      ) : (
        <Share2 size={22} color={colors.foreground} />
      )}
    </TouchableOpacity>
  )
}
