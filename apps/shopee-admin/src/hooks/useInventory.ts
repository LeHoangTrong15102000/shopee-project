import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import inventoryApi from 'src/apis/inventory.api';

export const INVENTORY_KEYS = {
  low: ['admin-inventory-low'] as const,
  out: ['admin-inventory-out'] as const,
};

export function useLowStock() {
  return useQuery({
    queryKey: INVENTORY_KEYS.low,
    queryFn: () => inventoryApi.getLowStock({ limit: 50 }).then((r) => r.data.data),
  });
}

export function useOutOfStock() {
  return useQuery({
    queryKey: INVENTORY_KEYS.out,
    queryFn: () => inventoryApi.getOutOfStock({ limit: 50 }).then((r) => r.data.data),
  });
}

export function useUpdateStock(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      inventoryApi.updateStock(id, { quantity: qty }),
    onSuccess: () => {
      toast.success('Stock updated');
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.low });
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.out });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update stock'),
  });
}

export function useBulkUpdateStock(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ product_id: string; quantity: number }>) =>
      inventoryApi.bulkUpdateStock({ items }),
    onSuccess: () => {
      toast.success('Products updated');
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.low });
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.out });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to bulk update stock'),
  });
}
