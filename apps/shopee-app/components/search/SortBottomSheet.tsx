import React, { useRef, useCallback } from 'react'
import { View, FlatList, Pressable } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'
import { AppText, AppButton } from '@/components/ui'
import { Check } from 'lucide-react-native'

export type SortOption = {
  label: string
  sortBy: string
  order: string
}

interface SortBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>
  selectedSort: SortOption
  onSelect: (option: SortOption) => void
}

export default function SortBottomSheet({
  bottomSheetRef,
  selectedSort,
  onSelect,
}: SortBottomSheetProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const SORT_OPTIONS: SortOption[] = [
    { label: t('sort.popular'), sortBy: 'sold', order: 'desc' },
    { label: t('sort.newest'), sortBy: 'createdAt', order: 'desc' },
    { label: t('sort.priceAsc'), sortBy: 'price', order: 'asc' },
    { label: t('sort.priceDesc'), sortBy: 'price', order: 'desc' },
  ]

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  )

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.neutrals1000 }}
      handleIndicatorStyle={{ backgroundColor: colors.neutrals400 }}>
      <BottomSheetView>
        <View className="px-4 pb-8 pt-2">
          <AppText raw variant="heading3" weight="semibold" className="mb-4">
            {t('sort.title')}
          </AppText>
          {SORT_OPTIONS.map((option) => {
            const isSelected =
              option.sortBy === selectedSort.sortBy && option.order === selectedSort.order
            return (
              <Pressable
                key={`${option.sortBy}-${option.order}`}
                onPress={() => {
                  onSelect(option)
                  bottomSheetRef.current?.dismiss()
                }}
                className="flex-row items-center justify-between py-3"
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}>
                <AppText raw variant="body" style={{ color: isSelected ? colors.primary : colors.foreground }}>
                  {option.label}
                </AppText>
                {isSelected && <Check size={18} color={colors.primary} />}
              </Pressable>
            )
          })}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

