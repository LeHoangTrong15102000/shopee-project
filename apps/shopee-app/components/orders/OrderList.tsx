import React from 'react'
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { useColors } from '@/hooks/useColors'
import OrderCard from './OrderCard'
import type { Order } from '@/apis/order.api'

interface OrderListProps {
  orders: Order[]
  isRefetching?: boolean
  isFetchingNextPage?: boolean
  onRefresh?: () => void
  onLoadMore?: () => void
  onPress: (id: string) => void
  onCancel?: (id: string) => void
  onConfirmReceived?: (id: string) => void
  onReturn?: (id: string) => void
}

export default function OrderList({
  orders,
  isRefetching,
  isFetchingNextPage,
  onRefresh,
  onLoadMore,
  onPress,
  onCancel,
  onConfirmReceived,
  onReturn,
}: OrderListProps) {
  const colors = useColors()

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <OrderCard
          order={item}
          onPress={onPress}
          onCancel={onCancel}
          onConfirmReceived={onConfirmReceived}
          onReturn={onReturn}
        />
      )}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefetching ?? false}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginVertical: 16 }}
          />
        ) : null
      }
    />
  )
}
