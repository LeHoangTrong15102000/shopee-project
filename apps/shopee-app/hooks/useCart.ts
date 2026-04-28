import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCart, updateCartItem, deleteCartItems } from '@/apis/cart.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const cartKeys = {
  all: () => ['cart'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCart() {
  return useQuery({
    queryKey: cartKeys.all(),
    queryFn: getCart,
    staleTime: 0,
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { product_id: string; buy_count: number }) => updateCartItem(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all() })
    },
    onError: handleMutationError,
  })
}

export function useDeleteCartItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (purchaseIds: string[]) => deleteCartItems(purchaseIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all() })
    },
    onError: handleMutationError,
  })
}
