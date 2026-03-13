import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Eye, MoreHorizontal } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Checkbox } from 'src/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'src/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import ordersApi from 'src/apis/orders.api'
import type { Order, OrderStatus } from 'src/types'

const statuses: (OrderStatus | 'all')[] = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function OrderListPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [selected, setSelected] = useState<Order[]>([])
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: () => ordersApi.getOrders({ page: page + 1, limit: 10, ...(status !== 'all' && { status }) }).then((r) => r.data.data),
  })

  const bulkMut = useMutation({
    mutationFn: (body: { order_ids: string[]; status: OrderStatus }) => ordersApi.bulkUpdateStatus(body),
    onSuccess: () => { toast.success('Orders updated'); setSelected([]); setBulkStatus(''); qc.invalidateQueries({ queryKey: ['admin-orders'] }) },
  })

  const columns: ColumnDef<Order>[] = [
    { id: 'select', header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} />, cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />, enableSorting: false },
    { accessorKey: '_id', header: 'Order ID', cell: ({ row }) => <span className="font-mono text-xs">{row.original._id.slice(-8)}</span> },
    { accessorKey: 'user', header: 'Customer', cell: ({ row }) => { const u = row.original.user; return typeof u === 'object' ? u.name || u.email : u } },
    { accessorKey: 'items', header: 'Items', cell: ({ row }) => `${row.original.items.length} item(s)` },
    { accessorKey: 'total_price', header: 'Total', cell: ({ row }) => `₫${row.original.total_price.toLocaleString()}` },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy') },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/orders/${row.original._id}`)}><Eye className="mr-2 size-4" />View Details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Manage customer orders" />
      <Tabs value={status} onValueChange={(v) => { setStatus(v as OrderStatus | 'all'); setPage(0) }}>
        <TabsList>{statuses.map((s) => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}</TabsList>
      </Tabs>
      <DataTable
        columns={columns} data={data?.orders ?? []} isLoading={isLoading} searchKey="_id" searchPlaceholder="Search orders..."
        enableRowSelection onRowSelectionChange={setSelected}
        manualPagination pageIndex={page} pageCount={data?.pagination?.totalPages ?? 1} onPaginationChange={(p) => setPage(p)} totalRows={data?.pagination?.total}
        bulkActions={selected.length > 0 ? (
          <div className="flex items-center gap-2">
            <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as OrderStatus)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Set status" /></SelectTrigger>
              <SelectContent>{(['processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" disabled={!bulkStatus || bulkMut.isPending} onClick={() => bulkStatus && bulkMut.mutate({ order_ids: selected.map((o) => o._id), status: bulkStatus as OrderStatus })}>Apply</Button>
          </div>
        ) : undefined}
      />
    </div>
  )
}

