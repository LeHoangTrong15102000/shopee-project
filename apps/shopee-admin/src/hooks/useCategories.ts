import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import categoriesApi from 'src/apis/categories.api';

export const CATEGORY_KEYS = {
  all: ['admin-categories'] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: CATEGORY_KEYS.all,
    queryFn: () => categoriesApi.getCategories().then((r) => r.data.data),
  });
}

export function useCreateCategory(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) => categoriesApi.createCategory(body),
    onSuccess: () => {
      toast.success('Category created');
      qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create category'),
  });
}

export function useUpdateCategory(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string } }) =>
      categoriesApi.updateCategory(id, body),
    onSuccess: () => {
      toast.success('Category updated');
      qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update category'),
  });
}

export function useDeleteCategory(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted');
      qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete. Category may have products.'),
  });
}
