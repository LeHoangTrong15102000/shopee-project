import React from 'react'
import { View, Pressable } from 'react-native'
import { Search, ShoppingCart } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'

export default function SearchHeader() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <View className="pt-safe-offset-3 flex-row items-center gap-3 bg-primary px-4 pb-3">
      <Pressable
        onPress={() => {
          // Navigate to search screen (placeholder)
        }}
        className="flex-1 flex-row items-center gap-2 rounded-sm bg-white px-3 py-2">
        <Search size={18} color="#999" />
        <AppText raw variant="bodySmall" style={{ color: '#999' }}>
          {t('SEARCH_PLACEHOLDER')}
        </AppText>
      </Pressable>
      <Pressable
        onPress={() => {
          // Navigate to cart (placeholder)
        }}>
        <ShoppingCart size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  )
}
