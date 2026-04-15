import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Plus, Trash2, MoreHorizontal, CheckCircle } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Textarea } from 'src/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { ErrorState } from 'src/components/shared/ErrorState'
import {
  useNotifications,
  useCreateNotification,
  useDeleteNotification,
  useMarkNotificationAsRead,
} from 'src/hooks/useNotifications'
import type { Notification } from 'src/types'

const notificationTemplates = [
  { value: 'custom', labelKey: 'form.custom' as const, title: '', message: '' },
  {
    value: 'maintenance',
    labelKey: 'form.templates.maintenance' as const,
    titleKey: 'form.templates.maintenanceTitle' as const,
    messageKey: 'form.templates.maintenanceMessage' as const,
  },
  {
    value: 'feature',
    labelKey: 'form.templates.newFeature' as const,
    titleKey: 'form.templates.newFeatureTitle' as const,
    messageKey: 'form.templates.newFeatureMessage' as const,
  },
  {
    value: 'promotion',
    labelKey: 'form.templates.promotion' as const,
    titleKey: 'form.templates.promotionTitle' as const,
    messageKey: 'form.templates.promotionMessage' as const,
  },
]

export default function NotificationListPage() {
  const [page, setPage] = useState(0)
  const [createType, setCreateType] = useState<'targeted' | 'broadcast' | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ user_id: '', title: '', message: '' })
  const [selectedTemplate, setSelectedTemplate] = useState('custom')
  const { t } = useTranslation('notifications')
  const { t: tc } = useTranslation('common')

  const { data, isLoading, isError, refetch } = useNotifications(page)
  const createMut = useCreateNotification(() => setCreateType(null))
  const deleteMut = useDeleteNotification(() => setDeleteId(null))
  const markReadMut = useMarkNotificationAsRead()

  const columns: ColumnDef<Notification>[] = [
    { accessorKey: 'title', header: t('columns.title') },
    {
      accessorKey: 'message',
      header: t('columns.message'),
      cell: ({ row }) => <span className="max-w-[200px] truncate">{row.original.message}</span>,
    },
    {
      accessorKey: 'type',
      header: t('columns.type'),
      cell: ({ row }) => <StatusBadge status={row.original.type} />,
    },
    {
      accessorKey: 'createdAt',
      header: t('columns.date'),
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
            {!row.original.is_read && (
              <DropdownMenuItem onClick={() => markReadMut.mutate(row.original._id)}>
                <CheckCircle className="mr-2 size-4" />
                {t('actions.markAsRead')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original._id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCreateType('targeted')
                setForm({ user_id: '', title: '', message: '' })
                setSelectedTemplate('custom')
              }}
            >
              <Plus className="mr-2 size-4" />
              {t('tabs.targeted')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setCreateType('broadcast')
                setForm({ user_id: '', title: '', message: '' })
                setSelectedTemplate('custom')
              }}
            >
              <Plus className="mr-2 size-4" />
              {t('tabs.broadcast')}
            </Button>
          </div>
        }
      />
      {isError && <ErrorState message={t('error')} onRetry={refetch} />}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createType === 'broadcast'
                ? t('form.broadcastNotification')
                : t('form.targetedNotification')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {createType === 'broadcast' && (
              <div className="space-y-1.5">
                <Label htmlFor="notif-template">{t('form.template')}</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={(v) => {
                    setSelectedTemplate(v || '')
                    const tpl = notificationTemplates.find((tp) => tp.value === v)
                    if (tpl) {
                      if (tpl.value === 'custom') {
                        setForm({ ...form, title: '', message: '' })
                      } else {
                        setForm({
                          ...form,
                          title: t((tpl as any).titleKey),
                          message: t((tpl as any).messageKey),
                        })
                      }
                    }
                  }}
                >
                  <SelectTrigger id="notif-template">
                    <SelectValue placeholder={t('form.selectTemplate')} />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTemplates.map((tp) => (
                      <SelectItem key={tp.value} value={tp.value}>
                        {t(tp.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {createType === 'targeted' && (
              <div className="space-y-1.5">
                <Label htmlFor="notif-user-id">{t('form.userId')}</Label>
                <Input
                  id="notif-user-id"
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="notif-title">{t('form.title')}</Label>
              <Input
                id="notif-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notif-message">{t('form.message')}</Label>
              <Textarea
                id="notif-message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createMut.mutate({ type: createType!, form })}
              disabled={createMut.isPending}
            >
              {tc('buttons.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t('toast.deleteTitle')}
        description={t('toast.deleteDescription')}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}
