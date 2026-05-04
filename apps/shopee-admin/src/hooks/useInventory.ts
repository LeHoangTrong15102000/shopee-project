import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import inventoryApi from 'src/apis/inventory.api'
import { useAdminMutationContext } from './useAdminMutationContext'

export const INVENTORY_KEYS = {
  low: ['admin-inventory-low'] as const,
  out: ['admin-inventory-out'] as const,
}

export function useLowStock() {
  return useQuery({
    queryKey: INVENTORY_KEYS.low,
    queryFn: () => inventoryApi.getLowStock({ limit: 50 }).then((r) => r.data.data),
  })
}

export function useOutOfStock() {
  return useQuery({
    queryKey: INVENTORY_KEYS.out,
    queryFn: () => inventoryApi.getOutOfStock({ limit: 50 }).then((r) => r.data.data),
  })
}

export function useUpdateStock(onSuccess?: () => void) {
  const { qc, addLog, email } = useAdminMutationContext()
  return useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      inventoryApi.updateStock(id, { quantity: qty }),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.stockUpdated', { ns: 'inventory' }))
      addLog({
        action: 'update',
        entityType: 'inventory',
        entityName: `${vars.id} → ${vars.qty}`,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.low })
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.out })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.updateStockFailed', { ns: 'inventory' }))
    },
  })
}

export function useBulkUpdateStock(onSuccess?: () => void) {
  const { qc, addLog, email } = useAdminMutationContext()
  return useMutation({
    mutationFn: (items: Array<{ product_id: string; quantity: number }>) =>
      inventoryApi.bulkUpdateStock({ items }),
    onSuccess: (_, items) => {
      toast.success(i18n.t('toast.productsUpdated', { ns: 'inventory' }))
      addLog({
        action: 'update',
        entityType: 'inventory',
        entityName: `${items.length} products`,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.low })
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.out })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.bulkUpdateFailed', { ns: 'inventory' }))
    },
  })
}
