import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, MoreHorizontal, Download, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
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
import { useOrders, useBulkUpdateOrderStatus, useOrderCountByStatus } from 'src/hooks/useOrders';
import { Badge } from 'src/components/ui/badge';
import { formatCurrency } from 'src/utils/format';
import type { Order, OrderStatus } from 'src/types';
import { exportToCSV } from 'src/utils/csv-export';

const statuses: (OrderStatus | 'all')[] = [
  'all',
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function OrderListPage() {
  const { t } = useTranslation('orders');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [selected, setSelected] = useState<Order[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | ''>('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const { data, isLoading, isError, refetch } = useOrders(page, status);
  const { data: countData } = useOrderCountByStatus();

  const countMap = new Map(countData?.map((c) => [c._id, c.count]) ?? []);
  const totalCount = countData?.reduce((sum, c) => sum + c.count, 0) ?? 0;

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
          aria-label={t('common:aria.selectAll')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={t('common:aria.selectRow')}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: '_id',
      header: t('columns.orderId'),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original._id.slice(-8)}</span>,
    },
    {
      accessorKey: 'user',
      header: t('columns.customer'),
      cell: ({ row }) => {
        const u = row.original.user;
        return typeof u === 'object' ? u.name || u.email : u;
      },
    },
    {
      accessorKey: 'items',
      header: t('columns.items'),
      cell: ({ row }) => t('itemCount', { count: row.original.items.length }),
    },
    {
      accessorKey: 'total_price',
      header: t('columns.total'),
      cell: ({ row }) => formatCurrency(row.original.total_price),
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
            <DropdownMenuItem onClick={() => navigate(`/orders/${row.original._id}`)}>
              <Eye className="mr-2 size-4" />
              {t('actions.viewDetails')}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToCSV(
                data?.orders ?? [],
                [
                  { key: '_id', header: t('columns.orderId') },
                  {
                    key: 'user',
                    header: t('columns.customer'),
                    accessor: (r) => {
                      const u = r.user as any;
                      return typeof u === 'object' ? u?.name || u?.email : String(u);
                    },
                  },
                  { key: 'total_price', header: t('columns.total') },
                  { key: 'status', header: t('columns.status') },
                  { key: 'createdAt', header: t('columns.date') },
                ],
                'orders',
              )
            }
          >
            <Download className="mr-2 size-4" />
            {tc('buttons.exportCsv')}
          </Button>
        }
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)}>
          <Filter className="mr-2 size-4" /> {tc('buttons.filters')}
        </Button>
        {(startDate || endDate || paymentMethod) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setPaymentMethod('');
            }}
          >
            <X className="mr-1 size-4" /> {tc('buttons.clearFilters')}
          </Button>
        )}
      </div>
      {filtersOpen && (
        <div className="grid gap-4 sm:grid-cols-3 rounded-lg border p-4">
          <div>
            <Label htmlFor="filter-start-date">{t('filters.startDate')}</Label>
            <Input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filter-end-date">{t('filters.endDate')}</Label>
            <Input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filter-payment">{t('filters.paymentMethod')}</Label>
            <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
              <SelectTrigger id="filter-payment">
                <SelectValue placeholder={t('filters.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">{t('filters.creditCard')}</SelectItem>
                <SelectItem value="bank_transfer">{t('filters.bankTransfer')}</SelectItem>
                <SelectItem value="cod">{t('filters.cod')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(v as OrderStatus | 'all');
          setPage(0);
        }}
      >
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap scroll-p-1">
          {statuses.map((s) => {
            const count = s === 'all' ? totalCount : (countMap.get(s) ?? 0);
            return (
              <TabsTrigger key={s} value={s} className="capitalize gap-1.5">
                {t(`status.${s}`)}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      {isError && <ErrorState message={t('error')} onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={(data?.orders ?? []).filter((o) => {
          if (startDate && new Date(o.createdAt) < new Date(startDate)) return false;
          if (endDate && new Date(o.createdAt) > new Date(endDate + 'T23:59:59')) return false;
          if (paymentMethod && o.payment_method !== paymentMethod) return false;
          return true;
        })}
        isLoading={isLoading}
        searchKey="_id"
        searchPlaceholder={t('search')}
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
                  <SelectValue placeholder={t('filters.setStatus')} />
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
                {tc('buttons.apply')}
              </Button>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
