import React, { useRef, useEffect } from 'react'
import { View, TextInput, Pressable } from 'react-native'
import { ArrowLeft, Search, X } from 'lucide-react-native'
import { useColors } from '@/hooks/useColors'
import { useTranslation } from 'react-i18next'

interface SearchInputProps {
  query: string
  onQueryChange: (text: string) => void
  onClear: () => void
  onBack?: () => void
  onSubmit?: (keyword: string) => void
  autoFocus?: boolean
}

export default function SearchInput({
  query,
  onQueryChange,
  onClear,
  onBack,
  onSubmit,
  autoFocus = true,
}: SearchInputProps) {
  const colors = useColors()
  const { t } = useTranslation()
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  return (
    <View
      className="pt-safe-offset-2 flex-row items-center gap-2 bg-primary px-3 pb-2"
      style={{ backgroundColor: colors.primary }}>
      {onBack && (
        <Pressable
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.goBack')}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </Pressable>
      )}

      <View className="flex-1 flex-row items-center rounded-sm px-3 py-2" style={{ backgroundColor: colors.neutrals900 }}>
        <Search size={16} color="#999" />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={onQueryChange}
          onSubmitEditing={() => query.trim() && onSubmit?.(query.trim())}
          placeholder={t('SEARCH_PLACEHOLDER')}
          placeholderTextColor="#999"
          returnKeyType="search"
          className="ml-2 flex-1 text-sm text-foreground"
          style={{ paddingVertical: 0, color: colors.foreground }}
        />
        {query.length > 0 && (
          <Pressable
            onPress={onClear}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.clearSearch')}>
            <X size={16} color="#999" />
          </Pressable>
        )}
      </View>
    </View>
  )
}
