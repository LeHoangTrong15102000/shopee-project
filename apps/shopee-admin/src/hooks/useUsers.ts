import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import usersApi from 'src/apis/users.api'
import { useActivityLogStore } from 'src/stores/activity-log.store'
import { useAuthStore } from 'src/stores/auth.store'

export const USER_KEYS = {
  list: (page: number) => ['admin-users', page] as const,
  all: ['admin-users'] as const,
}

export function useUsers(page: number) {
  return useQuery({
    queryKey: USER_KEYS.list(page),
    queryFn: () => usersApi.getUsers({ page: page + 1, limit: 10 }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useCreateUser(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (body: { email: string; password: string; name?: string; roles?: string[] }) =>
      usersApi.createUser(body),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.userCreated', { ns: 'users' }))
      addLog({ action: 'create', entityType: 'user', entityName: vars.email, adminEmail: email })
      qc.invalidateQueries({ queryKey: USER_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.createFailed', { ns: 'users' })),
  })
}

export function useUpdateUser(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: { name?: string; email?: string; roles?: string[] }
    }) => usersApi.updateUser(id, body),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.userUpdated', { ns: 'users' }))
      addLog({
        action: 'update',
        entityType: 'user',
        entityName: vars.body.email || vars.id,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: USER_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.updateFailed', { ns: 'users' })),
  })
}

export function useDeleteUser(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: (_, id) => {
      toast.success(i18n.t('toast.userDeleted', { ns: 'users' }))
      addLog({ action: 'delete', entityType: 'user', entityName: id, adminEmail: email })
      qc.invalidateQueries({ queryKey: USER_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.deleteFailed', { ns: 'users' })),
  })
}
