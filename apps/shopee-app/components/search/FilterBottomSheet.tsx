import React, { useState, useCallback } from 'react'
import { View, TextInput, Pressable } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useColors } from '@/hooks/useColors'
import { AppText, AppButton } from '@/components/ui'
import { Star } from 'lucide-react-native'

export interface FilterOptions {
  minPrice?: number
  maxPrice?: number
  rating?: number
}

interface FilterBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>
  initialFilters: FilterOptions
  onApply: (filters: FilterOptions) => void
}

export default function FilterBottomSheet({
  bottomSheetRef,
  initialFilters,
  onApply,
}: FilterBottomSheetProps) {
  const colors = useColors()
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice?.toString() ?? '')
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice?.toString() ?? '')
  const [selectedRating, setSelectedRating] = useState<number | undefined>(initialFilters.rating)

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  )

  const handleApply = () => {
    onApply({
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      rating: selectedRating,
    })
    bottomSheetRef.current?.dismiss()
  }

  const handleReset = () => {
    setMinPrice('')
    setMaxPrice('')
    setSelectedRating(undefined)
  }

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
            Bộ lọc
          </AppText>

          <AppText raw variant="label" weight="medium" className="mb-2">
            Khoảng giá
          </AppText>
          <View className="mb-4 flex-row items-center gap-3">
            <TextInput
              value={minPrice}
              onChangeText={setMinPrice}
              placeholder="Từ"
              keyboardType="numeric"
              placeholderTextColor={colors.neutrals600}
              className="flex-1 rounded-lg border border-neutrals700 bg-background px-3 py-2 text-foreground"
            />
            <AppText raw color="muted">—</AppText>
            <TextInput
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Đến"
              keyboardType="numeric"
              placeholderTextColor={colors.neutrals600}
              className="flex-1 rounded-lg border border-neutrals700 bg-background px-3 py-2 text-foreground"
            />
          </View>

          <AppText raw variant="label" weight="medium" className="mb-2">
            Đánh giá từ
          </AppText>
          <View className="mb-6 flex-row gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setSelectedRating(selectedRating === star ? undefined : star)}
                className={`flex-row items-center gap-1 rounded-full border px-3 py-1.5 ${
                  selectedRating === star
                    ? 'border-primary bg-primary'
                    : 'border-neutrals700 bg-transparent'
                }`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedRating === star }}
                accessibilityLabel={`${star} stars`}>
                <Star
                  size={14}
                  color={selectedRating === star ? '#ffffff' : colors.warning}
                  fill={colors.warning}
                />
                <AppText
                  raw
                  variant="labelSmall"
                  style={{ color: selectedRating === star ? '#ffffff' : colors.foreground }}>
                  {star}+
                </AppText>
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-3">
            <AppButton variant="outline" onPress={handleReset} className="flex-1">
              Đặt lại
            </AppButton>
            <AppButton variant="primary" onPress={handleApply} className="flex-1">
              Áp dụng
            </AppButton>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}
