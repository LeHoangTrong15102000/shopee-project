import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import productsApi from 'src/apis/products.api';

export const PRODUCT_KEYS = {
  list: (page: number) => ['admin-products', page] as const,
  all: ['admin-products'] as const,
};

export function useProducts(page: number) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(page),
    queryFn: () => productsApi.getProducts({ page: page + 1, limit: 10 }).then((r) => r.data.data),
  });
}

export function useDeleteProduct(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted');
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete product'),
  });
}

export function useDeleteManyProducts(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => productsApi.deleteManyProducts(ids),
    onSuccess: () => {
      toast.success('Products deleted');
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete products'),
  });
}
