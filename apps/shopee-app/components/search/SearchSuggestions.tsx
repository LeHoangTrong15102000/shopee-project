import React from 'react'
import { View, FlatList, Pressable } from 'react-native'
import { TrendingUp } from 'lucide-react-native'
import { useColors } from '@/hooks/useColors'
import { AppText } from '@/components/ui'
import { type SearchSuggestion } from '@/apis/search.api'

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[]
  onSelect: (keyword: string) => void
}

export default function SearchSuggestions({ suggestions, onSelect }: SearchSuggestionsProps) {
  const colors = useColors()

  if (suggestions.length === 0) return null

  return (
    <View className="px-4 py-2">
      <FlatList
        data={suggestions}
        keyExtractor={(item, index) => `${item.keyword}-${index}`}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item.keyword)}
            className="flex-row items-center gap-3 py-3"
            accessibilityRole="button"
            accessibilityLabel={`Search for ${item.keyword}`}>
            <TrendingUp size={16} color={colors.neutrals400} />
            <AppText raw variant="body" className="flex-1">
              {item.keyword}
            </AppText>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-neutrals900" />}
      />
    </View>
  )
}
