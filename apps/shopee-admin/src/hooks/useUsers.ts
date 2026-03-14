import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import usersApi from 'src/apis/users.api';

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
  return useMutation({
    mutationFn: (body: { email: string; password: string; name?: string; roles?: string[] }) =>
      usersApi.createUser(body),
    onSuccess: () => {
      toast.success('User created');
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create user'),
  });
}

export function useUpdateUser(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; email?: string; roles?: string[] };
    }) => usersApi.updateUser(id, body),
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to update user'),
  });
}

export function useDeleteUser(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete user'),
  });
}
