import React, { useState } from 'react'
import { View, Image, TouchableOpacity } from 'react-native'
import { Star, ChevronRight, MessageCircle } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { ShopSummary } from '@/apis/product-detail.api'
import { createOrGetConversation } from '@/apis/chat.api'

interface ShopSummaryCardProps {
  shopSummary: ShopSummary
}

export default function ShopSummaryCard({ shopSummary }: ShopSummaryCardProps) {
  const colors = useColors()
  const router = useRouter()
  const [chatLoading, setChatLoading] = useState(false)

  const handleChatWithSeller = async () => {
    if (chatLoading) return
    setChatLoading(true)
    try {
      const conversation = await createOrGetConversation(shopSummary._id)
      router.push(`/chat/${conversation._id}`)
    } catch {
      // silently fail — user stays on current screen
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <View
      className="mx-4 my-3 rounded-xl p-3"
      style={{ backgroundColor: colors.neutrals800 }}>
      <TouchableOpacity
        className="flex-row items-center gap-3"
        onPress={() => router.push(`/shop/${shopSummary._id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Visit ${shopSummary.name} shop`}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.neutrals700,
            overflow: 'hidden',
          }}>
          {shopSummary.avatar ? (
            <Image
              source={{ uri: shopSummary.avatar }}
              style={{ width: '100%', height: '100%' }}
              accessibilityLabel={`${shopSummary.name} avatar`}
            />
          ) : null}
        </View>

        <View className="flex-1">
          <AppText raw variant="body" weight="semibold" numberOfLines={1}>
            {shopSummary.name}
          </AppText>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Star size={12} color={colors.warning} fill={colors.warning} accessible={false} />
            <AppText raw variant="labelSmall" color="muted">
              {shopSummary.rating.toFixed(1)}
            </AppText>
          </View>
        </View>

        <ChevronRight size={18} color={colors.neutrals400} />
      </TouchableOpacity>

      <View className="flex-row gap-2 mt-3">
        <AppButton
          variant="outline"
          size="sm"
          className="flex-1"
          onPress={() => router.push(`/shop/${shopSummary._id}`)}>
          Xem Shop
        </AppButton>
        <AppButton
          variant="outline"
          size="sm"
          className="flex-1"
          loading={chatLoading}
          onPress={handleChatWithSeller}>
          Chat với Shop
        </AppButton>
      </View>
    </View>
  )
}
