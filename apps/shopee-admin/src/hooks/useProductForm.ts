import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from 'src/i18n/i18n';
import productsApi from 'src/apis/products.api';
import { PRODUCT_KEYS } from './useProducts';
import { PRODUCT_DETAIL_KEYS } from './useProductDetail';
import { useActivityLogStore } from 'src/stores/activity-log.store';
import { useAuthStore } from 'src/stores/auth.store';

interface ProductData {
  name: string;
  description?: string;
  price: number;
  price_before_discount?: number;
  quantity: number;
  category: string;
  image: string;
  location?: string;
}

export const PRODUCT_FORM_KEYS = PRODUCT_DETAIL_KEYS;

export function useProductFormData(id?: string) {
  return useQuery({
    queryKey: PRODUCT_DETAIL_KEYS.detail(id!),
    queryFn: () => productsApi.getProduct(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateProduct(onSuccess?: () => void) {
  const qc = useQueryClient();
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: (data: ProductData) => productsApi.createProduct(data),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.productCreated', { ns: 'products' }));
      addLog({ action: 'create', entityType: 'product', entityName: vars.name, adminEmail: email });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error(i18n.t('toast.createFailed', { ns: 'products' })),
  });
}

export function useUpdateProduct(onSuccess?: () => void) {
  const qc = useQueryClient();
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductData }) =>
      productsApi.updateProduct(id, data),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.productUpdated', { ns: 'products' }));
      addLog({
        action: 'update',
        entityType: 'product',
        entityName: vars.data.name,
        adminEmail: email,
      });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error(i18n.t('toast.updateFailed', { ns: 'products' })),
  });
}
