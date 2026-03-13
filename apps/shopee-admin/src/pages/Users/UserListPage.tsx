import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Avatar, AvatarFallback } from 'src/components/ui/avatar';
import { Badge } from 'src/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { DataTable } from 'src/components/shared/DataTable';
import { PageHeader } from 'src/components/shared/PageHeader';
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog';
import { ErrorState } from 'src/components/shared/ErrorState';
import usersApi from 'src/apis/users.api';
import type { User } from 'src/types';

export default function UserListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', roles: 'User' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => usersApi.getUsers({ page: page + 1, limit: 10 }).then((r) => r.data.data),
  });

  const createMut = useMutation({
    mutationFn: (body: { email: string; password: string; name?: string; roles?: string[] }) =>
      usersApi.createUser(body),
    onSuccess: () => {
      toast.success('User created');
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Failed to create user'),
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; email?: string; roles?: string[] };
    }) => usersApi.updateUser(id, body),
    onSuccess: () => {
      toast.success('User updated');
      setEditUser(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Failed to update user'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted');
      setDeleteUser(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'avatar',
      header: '',
      cell: ({ row }) => (
        <Avatar className="size-8">
          <AvatarFallback>
            {(row.original.name || row.original.email).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
      enableSorting: false,
    },
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => row.original.name || '—' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.roles.map((r) => (
            <Badge key={r} variant="secondary">
              {r}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="User actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditUser(row.original);
                setForm({
                  name: row.original.name || '',
                  email: row.original.email,
                  password: '',
                  roles: row.original.roles[0] || 'User',
                });
              }}
            >
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteUser(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage admin and user accounts"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setCreateOpen(true);
              setForm({ name: '', email: '', password: '', roles: 'User' });
            }}
          >
            <Plus className="mr-2 size-4" />
            Add User
          </Button>
        }
      />
      {isError && <ErrorState message="Failed to load users" onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search users..."
        manualPagination
        pageIndex={page}
        pageCount={data?.pagination?.total_pages ?? 1}
        onPaginationChange={(p) => setPage(p)}
        totalRows={data?.pagination?.total}
      />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-user-name">Name</Label>
              <Input
                id="create-user-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-user-email">Email</Label>
              <Input
                id="create-user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-user-password">Password</Label>
              <Input
                id="create-user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-user-role">Role</Label>
              <Input
                id="create-user-role"
                value={form.roles}
                onChange={(e) => setForm({ ...form, roles: e.target.value })}
                placeholder="User or Admin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                createMut.mutate({
                  email: form.email,
                  password: form.password,
                  name: form.name || undefined,
                  roles: [form.roles],
                })
              }
              disabled={createMut.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-user-name">Name</Label>
              <Input
                id="edit-user-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-user-email">Email</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-user-role">Role</Label>
              <Input
                id="edit-user-role"
                value={form.roles}
                onChange={(e) => setForm({ ...form, roles: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                editUser &&
                updateMut.mutate({
                  id: editUser._id,
                  body: { name: form.name, email: form.email, roles: [form.roles] },
                })
              }
              disabled={updateMut.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(o) => !o && setDeleteUser(null)}
        title="Delete User"
        description={`Are you sure you want to delete ${deleteUser?.name || deleteUser?.email}?`}
        onConfirm={() => deleteUser && deleteMut.mutate(deleteUser._id)}
        isLoading={deleteMut.isPending}
      />
    </div>
  );
}
