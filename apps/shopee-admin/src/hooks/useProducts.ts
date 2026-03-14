import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import productsApi from 'src/apis/products.api';
import { useActivityLogStore } from 'src/stores/activity-log.store';
import { useAuthStore } from 'src/stores/auth.store';

export const PRODUCT_KEYS = {
  list: (page: number, filters?: Record<string, string>) =>
    ['admin-products', page, filters] as const,
  all: ['admin-products'] as const,
};

export function useProducts(page: number, filters?: { category?: string; name?: string }) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(page, filters),
    queryFn: () =>
      productsApi.getProducts({ page: page + 1, limit: 10, ...filters }).then((r) => r.data.data),
  });
}

export function useDeleteProduct(onSuccess?: () => void) {
  const qc = useQueryClient();
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: (_, id) => {
      toast.success('Product deleted');
      addLog({ action: 'delete', entityType: 'product', entityName: id, adminEmail: email });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete product'),
  });
}

export function useDeleteManyProducts(onSuccess?: () => void) {
  const qc = useQueryClient();
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: (ids: string[]) => productsApi.deleteManyProducts(ids),
    onSuccess: (_, ids) => {
      toast.success('Products deleted');
      addLog({
        action: 'delete',
        entityType: 'product',
        entityName: `${ids.length} products`,
        adminEmail: email,
      });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete products'),
  });
}
