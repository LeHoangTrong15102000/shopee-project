import React, { useRef } from 'react'
import { View, Pressable } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { Trash2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, Checkbox, AppImage } from '@/components/ui'
import QuantitySelector from '@/components/product-detail/QuantitySelector'
import { useColors } from '@/hooks/useColors'
import { formatPrice, getDiscountPercent } from '@/utils/price'
import { type CartItem } from '@/apis/cart.api'

interface CartItemProps {
  item: CartItem
  isSelected: boolean
  onToggleSelect: (purchaseId: string) => void
  onQuantityChange: (productId: string, quantity: number) => void
  onDelete: (purchaseId: string) => void
}

export default function CartItemRow({
  item,
  isSelected,
  onToggleSelect,
  onQuantityChange,
  onDelete,
}: CartItemProps) {
  const colors = useColors()
  const { t } = useTranslation()
  const swipeRef = useRef<Swipeable>(null)
  const discount = getDiscountPercent(item.price, item.price_before_discount)

  const renderRightActions = () => (
    <Pressable
      onPress={() => {
        swipeRef.current?.close()
        onDelete(item._id)
      }}
      className="items-center justify-center bg-error px-5"
      accessibilityRole="button"
      accessibilityLabel={t('a11y.deleteCartItem')}>
      <Trash2 size={24} color={colors.primaryForeground} />
    </Pressable>
  )

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} friction={2}>
      <View className="flex-row items-center gap-3 bg-background px-4 py-3">
        <Checkbox
          checked={isSelected}
          variant="primary"
          onValueChange={() => onToggleSelect(item._id)}
        />

        <AppImage
          source={{ uri: item.product.image }}
          style={{ width: 72, height: 72, borderRadius: 8 }}
          contentFit="cover"
        />

        <View className="flex-1 gap-1">
          <AppText raw variant="bodySmall" numberOfLines={2}>
            {item.product.name}
          </AppText>
          <View className="flex-row items-center gap-2">
            <AppText raw variant="bodySmall" weight="semibold" color="primary">
              {formatPrice(item.price)}
            </AppText>
            {discount > 0 && (
              <AppText
                raw
                variant="labelSmall"
                color="muted"
                style={{ textDecorationLine: 'line-through' }}>
                {formatPrice(item.price_before_discount)}
              </AppText>
            )}
          </View>

          <View style={{ transform: [{ scale: 0.85 }], transformOrigin: 'left center' }}>
            <QuantitySelector
              value={item.buy_count}
              onChange={(val) => onQuantityChange(item.product._id, val)}
              max={item.product.quantity}
            />
          </View>
        </View>
      </View>
    </Swipeable>
  )
}
