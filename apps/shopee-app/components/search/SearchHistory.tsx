import React from 'react'
import { View, FlatList, Pressable } from 'react-native'
import { Clock, X } from 'lucide-react-native'
import { useColors } from '@/hooks/useColors'
import { AppText, AppButton } from '@/components/ui'
import { type SearchHistoryItem } from '@/apis/search.api'

interface SearchHistoryProps {
  items: SearchHistoryItem[]
  onSelect: (keyword: string) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

export default function SearchHistory({
  items,
  onSelect,
  onDelete,
  onClearAll,
}: SearchHistoryProps) {
  const colors = useColors()

  if (items.length === 0) return null

  return (
    <View className="px-4 py-2">
      <View className="mb-3 flex-row items-center justify-between">
        <AppText raw variant="heading5" weight="semibold">
          Lịch sử tìm kiếm
        </AppText>
        <Pressable onPress={onClearAll}>
          <AppText raw variant="bodySmall" color="primary">
            Xóa tất cả
          </AppText>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item.keyword)}
            className="flex-row items-center gap-3 py-2.5"
            accessibilityRole="button"
            accessibilityLabel={`Search for ${item.keyword}`}>
            <Clock size={16} color={colors.neutrals400} />
            <AppText raw variant="body" className="flex-1">
              {item.keyword}
            </AppText>
            <Pressable
              onPress={() => onDelete(item._id)}
              hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.keyword} from history`}>
              <X size={16} color={colors.neutrals400} />
            </Pressable>
          </Pressable>
        )}
        ItemSeparatorComponent={() => (
          <View className="h-px bg-neutrals900" />
        )}
      />
    </View>
  )
}
