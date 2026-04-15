import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Plus, Eye, Trash2, MoreHorizontal, Pencil, ToggleLeft } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { StatCard } from 'src/components/shared/StatCard'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { ErrorState } from 'src/components/shared/ErrorState'
import {
  useVouchers,
  useVoucherStats,
  useCreateVoucher,
  useDeleteVoucher,
  useUpdateVoucher,
  useToggleVoucher,
} from 'src/hooks/useVouchers'
import { formatCurrency } from 'src/utils/format'
import type { Voucher, DiscountType } from 'src/types'

export default function VoucherListPage() {
  const { t } = useTranslation('vouchers')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage' as DiscountType,
    discount_value: 0,
    min_order_value: 0,
    usage_limit: 100,
    start_date: '',
    end_date: '',
  })

  const { data, isLoading, isError, refetch } = useVouchers(page)
  const { data: stats } = useVoucherStats()
  const createMut = useCreateVoucher(() => setCreateOpen(false))
  const deleteMut = useDeleteVoucher(() => setDeleteId(null))
  const updateMut = useUpdateVoucher(() => setEditVoucher(null))
  const toggleMut = useToggleVoucher()

  const columns: ColumnDef<Voucher>[] = [
    {
      accessorKey: 'code',
      header: t('columns.code'),
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.code}</span>,
    },
    {
      accessorKey: 'discount_type',
      header: t('columns.type'),
      cell: ({ row }) =>
        row.original.discount_type === 'percentage'
          ? `${row.original.discount_value}%`
          : formatCurrency(row.original.discount_value),
    },
    {
      accessorKey: 'used_count',
      header: t('columns.usage'),
      cell: ({ row }) => `${row.original.used_count}/${row.original.usage_limit}`,
    },
    {
      accessorKey: 'is_active',
      header: t('columns.status'),
      cell: ({ row }) => <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} />,
    },
    {
      accessorKey: 'end_date',
      header: t('columns.expires'),
      cell: ({ row }) => format(new Date(row.original.end_date), 'MMM d, yyyy'),
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
            <DropdownMenuItem onClick={() => navigate(`/vouchers/${row.original._id}`)}>
              <Eye className="mr-2 size-4" />
              {t('actions.view')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setEditVoucher(row.original)
                setForm({
                  code: row.original.code,
                  discount_type: row.original.discount_type,
                  discount_value: row.original.discount_value,
                  min_order_value: row.original.min_order_value,
                  usage_limit: row.original.usage_limit,
                  start_date: row.original.start_date?.slice(0, 10) ?? '',
                  end_date: row.original.end_date?.slice(0, 10) ?? '',
                })
              }}
            >
              <Pencil className="mr-2 size-4" />
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleMut.mutate({ id: row.original._id, is_active: !row.original.is_active })
              }
            >
              <ToggleLeft className="mr-2 size-4" />
              {row.original.is_active ? t('actions.deactivate') : t('actions.activate')}
            </DropdownMenuItem>
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
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('actions.createVoucher')}
          </Button>
        }
      />
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t('stats.total')} value={stats.total} />
          <StatCard label={t('stats.active')} value={stats.active} />
          <StatCard label={t('stats.inactive')} value={stats.inactive} />
          <StatCard label={t('stats.totalUsage')} value={stats.total_usage} />
        </div>
      )}
      {isError && <ErrorState message={t('error')} onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={data?.vouchers ?? []}
        isLoading={isLoading}
        searchKey="code"
        manualPagination
        pageIndex={page}
        pageCount={data?.pagination?.totalPages ?? 1}
        onPaginationChange={(p) => setPage(p)}
        totalRows={data?.pagination?.total}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('actions.createVoucher')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-v-code">{t('form.code')}</Label>
              <Input
                id="create-v-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-v-type">{t('form.type')}</Label>
              <Select
                value={form.discount_type}
                onValueChange={(v) => setForm({ ...form, discount_type: v as DiscountType })}
              >
                <SelectTrigger id="create-v-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t('form.percentage')}</SelectItem>
                  <SelectItem value="fixed">{t('form.fixed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-v-value">{t('form.value')}</Label>
              <Input
                id="create-v-value"
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: +e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-v-min">{t('form.minOrder')}</Label>
              <Input
                id="create-v-min"
                type="number"
                value={form.min_order_value}
                onChange={(e) => setForm({ ...form, min_order_value: +e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-v-max">{t('form.maxUsage')}</Label>
              <Input
                id="create-v-max"
                type="number"
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: +e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-v-start">{t('form.startDate')}</Label>
              <Input
                id="create-v-start"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-v-end">{t('form.endDate')}</Label>
              <Input
                id="create-v-end"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>
              {tc('buttons.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editVoucher} onOpenChange={(o) => !o && setEditVoucher(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('actions.editVoucher')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-v-code">{t('form.code')}</Label>
              <Input
                id="edit-v-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-v-type">{t('form.type')}</Label>
              <Select
                value={form.discount_type}
                onValueChange={(v) => setForm({ ...form, discount_type: v as DiscountType })}
              >
                <SelectTrigger id="edit-v-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t('form.percentage')}</SelectItem>
                  <SelectItem value="fixed">{t('form.fixed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-v-value">{t('form.value')}</Label>
              <Input
                id="edit-v-value"
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: +e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-v-min">{t('form.minOrder')}</Label>
              <Input
                id="edit-v-min"
                type="number"
                value={form.min_order_value}
                onChange={(e) => setForm({ ...form, min_order_value: +e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-v-max">{t('form.maxUsage')}</Label>
              <Input
                id="edit-v-max"
                type="number"
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: +e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-v-start">{t('form.startDate')}</Label>
              <Input
                id="edit-v-start"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-v-end">{t('form.endDate')}</Label>
              <Input
                id="edit-v-end"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => editVoucher && updateMut.mutate({ id: editVoucher._id, body: form })}
              disabled={updateMut.isPending}
            >
              {tc('buttons.save')}
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
