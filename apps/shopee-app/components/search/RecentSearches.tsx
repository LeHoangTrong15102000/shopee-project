import React from 'react'
import { View, FlatList, Pressable } from 'react-native'
import { Clock, X } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'
import { AppText } from '@/components/ui'

interface RecentSearchesProps {
  searches: string[]
  onSelect: (term: string) => void
  onClear: () => void
}

export default function RecentSearches({ searches, onSelect, onClear }: RecentSearchesProps) {
  const { t } = useTranslation()
  const colors = useColors()

  if (searches.length === 0) return null

  return (
    <View className="px-4 py-2">
      <View className="mb-3 flex-row items-center justify-between">
        <AppText raw variant="heading5" weight="semibold">
          {t('searchHistory.title')}
        </AppText>
        <Pressable onPress={onClear}>
          <AppText raw variant="bodySmall" color="primary">
            {t('searchHistory.button.clearAll')}
          </AppText>
        </Pressable>
      </View>
      <FlatList
        data={searches}
        keyExtractor={(item, index) => `${item}-${index}`}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item)}
            className="flex-row items-center gap-3 py-2.5"
            accessibilityRole="button"
            accessibilityLabel={t('a11y.searchFor', { keyword: item })}>
            <Clock size={16} color={colors.neutrals400} />
            <AppText raw variant="body" className="flex-1">
              {item}
            </AppText>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-neutrals900" />}
      />
    </View>
  )
}
