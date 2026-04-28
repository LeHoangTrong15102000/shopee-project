import React from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'
import { Chip, AppText } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { Category } from '@/types/product.type'
import { useColors } from '@/hooks/useColors'

interface CategoryBarProps {
  categories: Category[]
  selectedCategory?: string
  onSelect: (categoryId?: string) => void
}

export default function CategoryBar({ categories, selectedCategory, onSelect }: CategoryBarProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const colors = useColors()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4 py-3">
      <Chip selected={!selectedCategory} onPress={() => onSelect(undefined)} variant="default">
        {t('CATEGORY_ALL')}
      </Chip>
      {categories.map((cat) => (
        <Chip
          key={cat._id}
          selected={selectedCategory === cat._id}
          onPress={() => onSelect(cat._id)}
          variant="default">
          {cat.name}
        </Chip>
      ))}
      <TouchableOpacity
        onPress={() => router.push('/categories')}
        className="items-center justify-center px-2"
        accessibilityRole="link"
        accessibilityLabel={t('categories.viewAll')}>
        <AppText raw variant="bodySmall" style={{ color: colors.primary }}>
          {t('categories.viewAll')}
        </AppText>
      </TouchableOpacity>
    </ScrollView>
  )
}

