import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import categoriesApi from 'src/apis/categories.api'
import { useActivityLogStore } from 'src/stores/activity-log.store'
import { useAuthStore } from 'src/stores/auth.store'

export const CATEGORY_KEYS = {
  all: ['admin-categories'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: CATEGORY_KEYS.all,
    queryFn: () => categoriesApi.getCategories().then((r) => r.data.data),
  })
}

export function useCreateCategory(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (body: { name: string }) => categoriesApi.createCategory(body),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.categoryCreated', { ns: 'categories' }))
      addLog({
        action: 'create',
        entityType: 'category',
        entityName: vars.name,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.createFailed', { ns: 'categories' })),
  })
}

export function useUpdateCategory(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string } }) =>
      categoriesApi.updateCategory(id, body),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.categoryUpdated', { ns: 'categories' }))
      addLog({
        action: 'update',
        entityType: 'category',
        entityName: vars.body.name,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.updateFailed', { ns: 'categories' })),
  })
}

export function useDeleteCategory(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: (_, id) => {
      toast.success(i18n.t('toast.categoryDeleted', { ns: 'categories' }))
      addLog({ action: 'delete', entityType: 'category', entityName: id, adminEmail: email })
      qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.deleteFailed', { ns: 'categories' })),
  })
}
