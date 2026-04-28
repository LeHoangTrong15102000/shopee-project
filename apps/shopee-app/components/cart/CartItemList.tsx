import React from 'react'
import { View, FlatList, RefreshControl } from 'react-native'
import { useColors } from '@/hooks/useColors'
import CartItemRow from './CartItem'
import type { CartItem } from '@/apis/cart.api'

interface CartItemListProps {
  items: CartItem[]
  selectedIds: Set<string>
  isRefetching?: boolean
  onRefresh?: () => void
  onToggleSelect: (purchaseId: string) => void
  onQuantityChange: (productId: string, quantity: number) => void
  onRemove: (purchaseId: string) => void
}

export default function CartItemList({
  items,
  selectedIds,
  isRefetching,
  onRefresh,
  onToggleSelect,
  onQuantityChange,
  onRemove,
}: CartItemListProps) {
  const colors = useColors()

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item._id}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefetching ?? false}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      renderItem={({ item }) => (
        <CartItemRow
          item={item}
          isSelected={selectedIds.has(item._id)}
          onToggleSelect={onToggleSelect}
          onQuantityChange={onQuantityChange}
          onDelete={onRemove}
        />
      )}
      ItemSeparatorComponent={() => <View className="h-px bg-neutrals900" />}
      contentContainerStyle={{ paddingBottom: 8 }}
    />
  )
}
