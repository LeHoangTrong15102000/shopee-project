import React, { useState, useRef, useCallback } from 'react'
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ShoppingCart } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText, EmptyState, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useCart, useUpdateCartItem, useDeleteCartItems } from '@/hooks/useCart'
import CartItemRow from '@/components/cart/CartItem'
import CartSummaryBar from '@/components/cart/CartSummaryBar'
import CartSkeleton from '@/components/cart/CartSkeleton'
import { useDialog } from '@/components/ui/DialogProvider'

export default function CartScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { showConfirm } = useDialog()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const pendingQuantities = useRef<Record<string, number>>({})
  const quantityTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const { data, isLoading, isRefetching, refetch } = useCart()
  const { mutate: updateItem } = useUpdateCartItem()
  const { mutate: deleteItems } = useDeleteCartItems()

  const cartItems = data?.data ?? []

  const toggleSelect = (purchaseId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(purchaseId)) {
        next.delete(purchaseId)
      } else {
        next.add(purchaseId)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === cartItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(cartItems.map((item) => item._id)))
    }
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    pendingQuantities.current[productId] = quantity
    if (quantityTimers.current[productId]) {
      clearTimeout(quantityTimers.current[productId])
    }
    quantityTimers.current[productId] = setTimeout(() => {
      updateItem({ product_id: productId, buy_count: quantity })
    }, 500)
  }

  const handleDelete = useCallback(
    (purchaseId: string) => {
      showConfirm(
        t('cart.dialog.removeTitle'),
        t('cart.dialog.removeMessage'),
        () => {
          deleteItems([purchaseId], {
            onSuccess: () => {
              setSelectedIds((prev) => {
                const next = new Set(prev)
                next.delete(purchaseId)
                return next
              })
            },
          })
        },
        undefined,
        'horizontal'
      )
    },
    [showConfirm, deleteItems, t]
  )

  const selectedItems = cartItems.filter((item) => selectedIds.has(item._id))
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price * item.buy_count, 0)

  const handleCheckout = () => {
    const purchaseIds = selectedItems.map((item) => item._id)
    router.push({ pathname: '/checkout', params: { purchase_ids: purchaseIds.join(',') } })
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="border-b border-neutrals900 px-4 py-4">
          <AppText variant="heading2">{t('cart.header.title')}</AppText>
        </View>
        <CartSkeleton />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="border-b border-neutrals900 px-4 py-4">
        <AppText raw variant="heading2">
          {t('cart.header.title')} ({cartItems.length})
        </AppText>
      </View>

      {cartItems.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <EmptyState
            icon={ShoppingCart}
            message={t('cart.empty.message')}
            actionLabel={t('cart.empty.action')}
            onAction={() => router.push('/(tabs)/home')}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <CartItemRow
                item={item}
                isSelected={selectedIds.has(item._id)}
                onToggleSelect={toggleSelect}
                onQuantityChange={handleQuantityChange}
                onDelete={handleDelete}
              />
            )}
            ItemSeparatorComponent={() => <View className="h-px bg-neutrals900" />}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
          <CartSummaryBar
            totalSelected={selectedIds.size}
            totalAmount={totalAmount}
            allSelected={selectedIds.size === cartItems.length && cartItems.length > 0}
            onToggleAll={toggleAll}
            onCheckout={handleCheckout}
          />
        </>
      )}
    </SafeAreaView>
  )
}
