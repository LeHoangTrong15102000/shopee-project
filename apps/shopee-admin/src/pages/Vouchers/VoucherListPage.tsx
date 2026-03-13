import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Plus, Eye, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'src/components/ui/dropdown-menu'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { StatCard } from 'src/components/shared/StatCard'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import vouchersApi from 'src/apis/vouchers.api'
import type { Voucher, DiscountType } from 'src/types'

export default function VoucherListPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', discount_type: 'percentage' as DiscountType, discount_value: 0, min_order_value: 0, max_usage: 100, start_date: '', end_date: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vouchers', page],
    queryFn: () => vouchersApi.getVouchers({ page: page + 1, limit: 10 }).then((r) => r.data.data),
  })
  const { data: stats } = useQuery({ queryKey: ['admin-voucher-stats'], queryFn: () => vouchersApi.getVoucherStats().then((r) => r.data.data) })

  const createMut = useMutation({
    mutationFn: () => vouchersApi.createVoucher(form),
    onSuccess: () => { toast.success('Voucher created'); setCreateOpen(false); qc.invalidateQueries({ queryKey: ['admin-vouchers'] }) },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => vouchersApi.deleteVoucher(id),
    onSuccess: () => { toast.success('Voucher deleted'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['admin-vouchers'] }) },
  })

  const columns: ColumnDef<Voucher>[] = [
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => <span className="font-mono font-medium">{row.original.code}</span> },
    { accessorKey: 'discount_type', header: 'Type', cell: ({ row }) => row.original.discount_type === 'percentage' ? `${row.original.discount_value}%` : `₫${row.original.discount_value.toLocaleString()}` },
    { accessorKey: 'used_count', header: 'Usage', cell: ({ row }) => `${row.original.used_count}/${row.original.max_usage}` },
    { accessorKey: 'is_active', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} /> },
    { accessorKey: 'end_date', header: 'Expires', cell: ({ row }) => format(new Date(row.original.end_date), 'MMM d, yyyy') },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/vouchers/${row.original._id}`)}><Eye className="mr-2 size-4" />View</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteId(row.original._id)} className="text-destructive"><Trash2 className="mr-2 size-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Vouchers" description="Manage discount vouchers" actions={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 size-4" />Create Voucher</Button>} />
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Inactive" value={stats.inactive} />
          <StatCard label="Total Usage" value={stats.total_usage} />
        </div>
      )}
      <DataTable columns={columns} data={data?.vouchers ?? []} isLoading={isLoading} searchKey="code" manualPagination pageIndex={page} pageCount={data?.pagination?.totalPages ?? 1} onPaginationChange={(p) => setPage(p)} totalRows={data?.pagination?.total} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Voucher</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label>Type</Label>
              <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v as DiscountType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Value</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: +e.target.value })} /></div>
            <div><Label>Min Order</Label><Input type="number" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: +e.target.value })} /></div>
            <div><Label>Max Usage</Label><Input type="number" value={form.max_usage} onChange={(e) => setForm({ ...form, max_usage: +e.target.value })} /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Voucher" description="This will permanently delete this voucher." onConfirm={() => deleteId && deleteMut.mutate(deleteId)} isLoading={deleteMut.isPending} />
    </div>
  )
}

