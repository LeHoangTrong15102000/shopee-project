import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Plus, Pencil, Trash2, Eye, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from 'src/hooks/useUsers';
import { useNavigate } from 'react-router-dom';
import { exportToCSV } from 'src/utils/csv-export';
import type { User } from 'src/types';

export default function UserListPage() {
  const { t } = useTranslation('users');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', roles: 'User' });

  const { data, isLoading, isError, refetch } = useUsers(page);
  const createMut = useCreateUser(() => setCreateOpen(false));
  const updateMut = useUpdateUser(() => setEditUser(null));
  const deleteMut = useDeleteUser(() => setDeleteUser(null));

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
    { accessorKey: 'name', header: t('columns.name'), cell: ({ row }) => row.original.name || '—' },
    { accessorKey: 'email', header: t('columns.email') },
    {
      accessorKey: 'roles',
      header: t('columns.roles'),
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
      header: t('columns.created'),
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" aria-label={t('common:aria.actions')} />}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/users/${row.original._id}`)}>
              <Eye className="mr-2 size-4" />
              {t('actions.view')}
            </DropdownMenuItem>
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
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteUser(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCSV(
                  data?.items ?? [],
                  [
                    { key: 'name', header: t('columns.name') },
                    { key: 'email', header: t('columns.email') },
                    {
                      key: 'roles',
                      header: t('columns.roles'),
                      accessor: (r) => (r.roles as string[]).join(', '),
                    },
                    { key: 'createdAt', header: t('columns.created') },
                  ],
                  'users',
                )
              }
            >
              <Download className="mr-2 size-4" />
              {tc('buttons.exportCsv')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setCreateOpen(true);
                setForm({ name: '', email: '', password: '', roles: 'User' });
              }}
            >
              <Plus className="mr-2 size-4" />
              {t('actions.addUser')}
            </Button>
          </div>
        }
      />
      {isError && <ErrorState message={t('error')} onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder={t('search')}
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
            <DialogTitle>{t('actions.createUser')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-user-name">{t('form.name')}</Label>
              <Input
                id="create-user-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-user-email">{t('form.email')}</Label>
              <Input
                id="create-user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-user-password">{t('form.password')}</Label>
              <Input
                id="create-user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-user-role">{t('form.role')}</Label>
              <Input
                id="create-user-role"
                value={form.roles}
                onChange={(e) => setForm({ ...form, roles: e.target.value })}
                placeholder={t('form.rolePlaceholder')}
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
              {tc('buttons.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.editUser')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-user-name">{t('form.name')}</Label>
              <Input
                id="edit-user-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-user-email">{t('form.email')}</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-user-role">{t('form.role')}</Label>
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
              {tc('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(o) => !o && setDeleteUser(null)}
        title={t('toast.deleteTitle')}
        description={t('toast.deleteDescription', { name: deleteUser?.name || deleteUser?.email })}
        onConfirm={() => deleteUser && deleteMut.mutate(deleteUser._id)}
        isLoading={deleteMut.isPending}
      />
    </div>
  );
}
