import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import usersApi from 'src/apis/users.api';
import { useActivityLogStore } from 'src/stores/activity-log.store';
import { useAuthStore } from 'src/stores/auth.store';

export const USER_KEYS = {
  list: (page: number) => ['admin-users', page] as const,
  all: ['admin-users'] as const,
};

export function useUsers(page: number) {
  return useQuery({
    queryKey: USER_KEYS.list(page),
    queryFn: () => usersApi.getUsers({ page: page + 1, limit: 10 }).then((r) => r.data.data),
  });
}

export function useCreateUser(onSuccess?: () => void) {
  const qc = useQueryClient();
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: (body: { email: string; password: string; name?: string; roles?: string[] }) =>
      usersApi.createUser(body),
    onSuccess: (_, vars) => {
      toast.success('User created');
      addLog({ action: 'create', entityType: 'user', entityName: vars.email, adminEmail: email });
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create user'),
  });
}

export function useUpdateUser(onSuccess?: () => void) {
  const qc = useQueryClient();
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; email?: string; roles?: string[] };
    }) => usersApi.updateUser(id, body),
    onSuccess: (_, vars) => {
      toast.success('User updated');
      addLog({
        action: 'update',
        entityType: 'user',
        entityName: vars.body.email || vars.id,
        adminEmail: email,
      });
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update user'),
  });
}

export function useDeleteUser(onSuccess?: () => void) {
  const qc = useQueryClient();
  const addLog = useActivityLogStore((s) => s.addLog);
  const email = useAuthStore((s) => s.user?.email ?? 'admin');
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: (_, id) => {
      toast.success('User deleted');
      addLog({ action: 'delete', entityType: 'user', entityName: id, adminEmail: email });
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete user'),
  });
}
