import React from 'react'
import { View, Pressable } from 'react-native'
import { Search, ShoppingCart } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

export default function SearchHeader() {
  const router = useRouter()
  const { t } = useTranslation()
  const colors = useColors()

  return (
    <View className="pt-safe-offset-3 flex-row items-center gap-3 bg-primary px-4 pb-3">
      <Pressable
        onPress={() => router.push('/search')}
        className="flex-1 flex-row items-center gap-2 rounded-sm px-3 py-2"
        style={{ backgroundColor: colors.neutrals900 }}>
        <Search size={18} color={colors.neutrals500} />
        <AppText raw variant="bodySmall" style={{ color: colors.neutrals500 }}>
          {t('SEARCH_PLACEHOLDER')}
        </AppText>
      </Pressable>
      <Pressable onPress={() => router.push('/(tabs)/cart')}>
        <ShoppingCart size={24} color={colors.primaryForeground} />
      </Pressable>
    </View>
  )
}
