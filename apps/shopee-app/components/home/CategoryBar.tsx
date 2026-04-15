import React from 'react'
import { ScrollView } from 'react-native'
import { Chip } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { Category } from '@/services/product.api'

interface CategoryBarProps {
  categories: Category[]
  selectedCategory?: string
  onSelect: (categoryId?: string) => void
}

export default function CategoryBar({ categories, selectedCategory, onSelect }: CategoryBarProps) {
  const { t } = useTranslation()

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
    </ScrollView>
  )
}
