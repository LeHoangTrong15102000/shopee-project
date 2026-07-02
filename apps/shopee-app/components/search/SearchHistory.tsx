import React from 'react'
import { View, FlatList, Pressable } from 'react-native'
import { Clock, X } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'
import { AppText } from '@/components/ui'

interface SearchHistoryProps {
  items: string[]
  onSelect: (keyword: string) => void
  onDelete: (keyword: string) => void
  onClearAll: () => void
}

export default function SearchHistory({
  items,
  onSelect,
  onDelete,
  onClearAll,
}: SearchHistoryProps) {
  const { t } = useTranslation()
  const colors = useColors()

  if (items.length === 0) return null

  return (
    <View className="px-4 py-2">
      <View className="mb-3 flex-row items-center justify-between">
        <AppText raw variant="heading5" weight="semibold">
          {t('searchHistory.title')}
        </AppText>
        <Pressable onPress={onClearAll}>
          <AppText raw variant="bodySmall" color="primary">
            {t('searchHistory.button.clearAll')}
          </AppText>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item, index) => item + index}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item)}
            className="flex-row items-center gap-3 py-2.5"
            accessibilityRole="button"
            accessibilityLabel={`Search for ${item}`}>
            <Clock size={16} color={colors.neutrals400} />
            <AppText raw variant="body" className="flex-1">
              {item}
            </AppText>
            <Pressable
              onPress={() => onDelete(item)}
              hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item} from history`}>
              <X size={16} color={colors.neutrals400} />
            </Pressable>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-neutrals900" />}
      />
    </View>
  )
}
