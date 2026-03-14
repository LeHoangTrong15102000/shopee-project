import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import productsApi from 'src/apis/products.api';
import { PRODUCT_KEYS } from './useProducts';
import { PRODUCT_DETAIL_KEYS } from './useProductDetail';

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
  return useMutation({
    mutationFn: (data: ProductData) => productsApi.createProduct(data),
    onSuccess: () => {
      toast.success('Product created');
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create product'),
  });
}

export function useUpdateProduct(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductData }) =>
      productsApi.updateProduct(id, data),
    onSuccess: () => {
      toast.success('Product updated');
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update product'),
  });
}
