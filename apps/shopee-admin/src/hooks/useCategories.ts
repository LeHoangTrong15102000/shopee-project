import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import categoriesApi from 'src/apis/categories.api';
import { useActivityLogStore } from 'src/stores/activity-log.store';
import { useAuthStore } from 'src/stores/auth.store';

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
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: (body: { name: string }) => categoriesApi.createCategory(body),
    onSuccess: (_, vars) => {
      toast.success('Category created');
      addLog({ action: 'create', entityType: 'category', entityName: vars.name, adminEmail: email });
      qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create category'),
  });
}

export function useUpdateCategory(onSuccess?: () => void) {
  const qc = useQueryClient();
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string } }) =>
      categoriesApi.updateCategory(id, body),
    onSuccess: (_, vars) => {
      toast.success('Category updated');
      addLog({ action: 'update', entityType: 'category', entityName: vars.body.name, adminEmail: email });
      qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update category'),
  });
}

export function useDeleteCategory(onSuccess?: () => void) {
  const qc = useQueryClient();
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: (_, id) => {
      toast.success('Category deleted');
      addLog({ action: 'delete', entityType: 'category', entityName: id, adminEmail: email });
      qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete. Category may have products.'),
  });
}
