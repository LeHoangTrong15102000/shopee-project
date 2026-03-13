import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { DataTable } from 'src/components/shared/DataTable';
import { PageHeader } from 'src/components/shared/PageHeader';
import { StatusBadge } from 'src/components/shared/StatusBadge';
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog';
import { ErrorState } from 'src/components/shared/ErrorState';
import notificationsApi from 'src/apis/notifications.api';
import type { Notification } from 'src/types';

export default function NotificationListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [createType, setCreateType] = useState<'targeted' | 'broadcast' | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ user_id: '', title: '', message: '' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-notifications', page],
    queryFn: () =>
      notificationsApi.getNotifications({ page: page + 1, limit: 10 }).then((r) => r.data.data),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createType === 'broadcast'
        ? notificationsApi.broadcastNotification({ title: form.title, message: form.message })
        : notificationsApi.createNotification(form),
    onSuccess: () => {
      toast.success('Notification sent');
      setCreateType(null);
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: () => toast.error('Failed to send notification'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      toast.success('Notification deleted');
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: () => toast.error('Failed to delete notification'),
  });

  const columns: ColumnDef<Notification>[] = [
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => <span className="max-w-[200px] truncate">{row.original.message}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <StatusBadge status={row.original.type} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Notification actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original._id)}
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
        title="Notifications"
        description="Send and manage notifications"
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCreateType('targeted');
                setForm({ user_id: '', title: '', message: '' });
              }}
            >
              <Plus className="mr-2 size-4" />
              Targeted
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setCreateType('broadcast');
                setForm({ user_id: '', title: '', message: '' });
              }}
            >
              <Plus className="mr-2 size-4" />
              Broadcast
            </Button>
          </div>
        }
      />
      {isError && <ErrorState message="Failed to load notifications" onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={data?.notifications ?? []}
        isLoading={isLoading}
        searchKey="title"
        manualPagination
        pageIndex={page}
        pageCount={data?.pagination?.totalPages ?? 1}
        onPaginationChange={(p) => setPage(p)}
        totalRows={data?.pagination?.total}
      />

      <Dialog open={!!createType} onOpenChange={(o) => !o && setCreateType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createType === 'broadcast' ? 'Broadcast' : 'Targeted'} Notification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {createType === 'targeted' && (
              <div>
                <Label htmlFor="notif-user-id">User ID</Label>
                <Input
                  id="notif-user-id"
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label htmlFor="notif-title">Title</Label>
              <Input
                id="notif-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notif-message">Message</Label>
              <Textarea
                id="notif-message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Notification"
        description="This will permanently delete this notification."
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        isLoading={deleteMut.isPending}
      />
    </div>
  );
}
