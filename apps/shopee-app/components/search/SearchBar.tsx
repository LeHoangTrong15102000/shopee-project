import React, { useRef, useEffect } from 'react'
import { View, TextInput, Pressable } from 'react-native'
import { ArrowLeft, Search, X } from 'lucide-react-native'
import { useColors } from '@/hooks/useColors'
import { useTranslation } from 'react-i18next'

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  onSubmit: (keyword: string) => void
  onBack: () => void
  onClear: () => void
  autoFocus?: boolean
}

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onBack,
  onClear,
  autoFocus = true,
}: SearchBarProps) {
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
      <Pressable
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.goBack')}>
        <ArrowLeft size={24} color={colors.primaryForeground} />
      </Pressable>

      <View
        className="flex-1 flex-row items-center rounded-sm px-3 py-2"
        style={{ backgroundColor: colors.neutrals900 }}>
        <Search size={16} color={colors.neutrals500} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={() => value.trim() && onSubmit(value.trim())}
          placeholder={t('SEARCH_PLACEHOLDER')}
          placeholderTextColor={colors.neutrals500}
          returnKeyType="search"
          className="ml-2 flex-1 text-sm text-foreground"
          style={{ paddingVertical: 0, color: colors.foreground }}
        />
        {value.length > 0 && (
          <Pressable
            onPress={onClear}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.clearSearch')}>
            <X size={16} color={colors.neutrals500} />
          </Pressable>
        )}
      </View>
    </View>
  )
}
