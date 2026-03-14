import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, MoreHorizontal } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { DataTable } from 'src/components/shared/DataTable';
import { PageHeader } from 'src/components/shared/PageHeader';
import { StatusBadge } from 'src/components/shared/StatusBadge';
import { ErrorState } from 'src/components/shared/ErrorState';
import { useOrders, useBulkUpdateOrderStatus } from 'src/hooks/useOrders';
import { formatCurrency } from 'src/utils/format';
import type { Order, OrderStatus } from 'src/types';

const statuses: (OrderStatus | 'all')[] = [
  'all',
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function OrderListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [selected, setSelected] = useState<Order[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | ''>('');

  const { data, isLoading, isError, refetch } = useOrders(page, status);

  const bulkMut = useBulkUpdateOrderStatus(() => {
    setSelected([]);
    setBulkStatus('');
  });

  const columns: ColumnDef<Order>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />
      ),
      enableSorting: false,
    },
    {
      accessorKey: '_id',
      header: 'Order ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original._id.slice(-8)}</span>,
    },
    {
      accessorKey: 'user',
      header: 'Customer',
      cell: ({ row }) => {
        const u = row.original.user;
        return typeof u === 'object' ? u.name || u.email : u;
      },
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => `${row.original.items.length} item(s)`,
    },
    {
      accessorKey: 'total_price',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.original.total_price),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
            <Button variant="ghost" size="sm" aria-label="Order actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/orders/${row.original._id}`)}>
              <Eye className="mr-2 size-4" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Manage customer orders" />
      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(v as OrderStatus | 'all');
          setPage(0);
        }}
      >
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap scroll-p-1">
          {statuses.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {isError && <ErrorState message="Failed to load orders" onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={data?.orders ?? []}
        isLoading={isLoading}
        searchKey="_id"
        searchPlaceholder="Search orders..."
        enableRowSelection
        onRowSelectionChange={setSelected}
        manualPagination
        pageIndex={page}
        pageCount={data?.pagination?.totalPages ?? 1}
        onPaginationChange={(p) => setPage(p)}
        totalRows={data?.pagination?.total}
        bulkActions={
          selected.length > 0 ? (
            <div className="flex items-center gap-2">
              <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as OrderStatus)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  {(['processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(
                    (s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!bulkStatus || bulkMut.isPending}
                onClick={() =>
                  bulkStatus &&
                  bulkMut.mutate({
                    order_ids: selected.map((o) => o._id),
                    status: bulkStatus as OrderStatus,
                  })
                }
              >
                Apply
              </Button>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
