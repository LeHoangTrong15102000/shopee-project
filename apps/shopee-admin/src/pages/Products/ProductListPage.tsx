import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Eye, Pencil, Trash2, Download, Filter, X } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Checkbox } from 'src/components/ui/checkbox';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { DataTable } from 'src/components/shared/DataTable';
import { PageHeader } from 'src/components/shared/PageHeader';
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog';
import { ErrorState } from 'src/components/shared/ErrorState';
import { useProducts, useDeleteProduct, useDeleteManyProducts } from 'src/hooks/useProducts';
import { useCategories } from 'src/hooks/useCategories';
import { formatCurrency } from 'src/utils/format';
import { exportToCSV } from 'src/utils/csv-export';
import type { Product } from 'src/types';

export default function ProductListPage() {
  const { t } = useTranslation('products');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Product[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const filters = useMemo(
    () => ({
      ...(categoryFilter && { category: categoryFilter }),
    }),
    [categoryFilter],
  );
  const { data, isLoading, isError, refetch } = useProducts(
    page,
    Object.keys(filters).length ? filters : undefined,
  );
  const { data: categories } = useCategories();
  const deleteMut = useDeleteProduct(() => setDeleteId(null));
  const bulkDeleteMut = useDeleteManyProducts(() => {
    setBulkDeleteOpen(false);
    setSelected([]);
  });

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
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
      accessorKey: 'image',
      header: '',
      cell: ({ row }) => (
        <img
          src={row.original.image}
          alt={row.original.name}
          className="size-10 rounded object-cover"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: t('columns.name'),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'price',
      header: t('columns.price'),
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    { accessorKey: 'quantity', header: t('columns.stock') },
    { accessorKey: 'sold', header: t('columns.sold') },
    {
      accessorKey: 'category',
      header: t('columns.category'),
      cell: ({ row }) => {
        const c = row.original.category;
        return typeof c === 'object' ? c.name : c;
      },
    },
    {
      accessorKey: 'rating',
      header: t('columns.rating'),
      cell: ({ row }) => <Badge variant="secondary">{row.original.rating.toFixed(1)} ★</Badge>,
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
            <DropdownMenuItem onClick={() => navigate(`/products/${row.original._id}`)}>
              <Eye className="mr-2 size-4" />
              {t('actions.view')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/products/${row.original._id}/edit`)}>
              <Pencil className="mr-2 size-4" />
              {t('actions.edit')}
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
  ],
  [t, navigate, setDeleteId],
);

  const handleExportCSV = useCallback(
    () =>
      exportToCSV(
        data?.products ?? [],
        [
          { key: 'name', header: t('columns.name') },
          { key: 'price', header: t('columns.price') },
          { key: 'quantity', header: t('columns.stock') },
          { key: 'sold', header: t('columns.sold') },
          { key: 'rating', header: t('columns.rating') },
          {
            key: 'category',
            header: t('columns.category'),
            accessor: (r) =>
              typeof r.category === 'object'
                ? (r.category as any)?.name
                : String(r.category),
          },
        ],
        'products',
      ),
    [data?.products, t],
  );

  const filteredProducts = useMemo(
    () =>
      (data?.products ?? []).filter((p) => {
        if (minPrice && p.price < Number(minPrice)) return false;
        if (maxPrice && p.price > Number(maxPrice)) return false;
        if (stockFilter === 'in_stock' && p.quantity <= 0) return false;
        if (stockFilter === 'low_stock' && (p.quantity <= 0 || p.quantity >= 10)) return false;
        if (stockFilter === 'out_of_stock' && p.quantity > 0) return false;
        return true;
      }),
    [data?.products, minPrice, maxPrice, stockFilter],
  );

  const handleClearFilters = useCallback(() => {
    setCategoryFilter('');
    setMinPrice('');
    setMaxPrice('');
    setStockFilter('');
    setPage(0);
  }, []);

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
              onClick={handleExportCSV}
            >
              <Download className="mr-2 size-4" />
              {tc('buttons.exportCsv')}
            </Button>
            <Button size="sm" onClick={() => navigate('/products/new')}>
              <Plus className="mr-2 size-4" />
              {t('actions.addProduct')}
            </Button>
          </div>
        }
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)}>
          <Filter className="mr-2 size-4" />
          {tc('buttons.filters')}
        </Button>
        {(categoryFilter || minPrice || maxPrice || stockFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
          >
            <X className="mr-1 size-4" /> {tc('buttons.clearFilters')}
          </Button>
        )}
      </div>
      {filtersOpen && (
        <div className="grid gap-4 sm:grid-cols-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="filter-category">{t('filters.category')}</Label>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                if (v) {
                  setCategoryFilter(v);
                  setPage(0);
                }
              }}
            >
              <SelectTrigger id="filter-category">
                <SelectValue placeholder={t('filters.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-min-price">{t('filters.minPrice')}</Label>
            <Input
              id="filter-min-price"
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filter-max-price">{t('filters.maxPrice')}</Label>
            <Input
              id="filter-max-price"
              type="number"
              placeholder={t('filters.any')}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filter-stock">{t('filters.stockStatus')}</Label>
            <Select value={stockFilter} onValueChange={(v) => v && setStockFilter(v)}>
              <SelectTrigger id="filter-stock">
                <SelectValue placeholder={t('filters.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">{t('filters.inStock')}</SelectItem>
                <SelectItem value="low_stock">{t('filters.lowStock')}</SelectItem>
                <SelectItem value="out_of_stock">{t('filters.outOfStock')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {isError && <ErrorState message={t('error')} onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder={t('search')}
        enableRowSelection
        onRowSelectionChange={setSelected}
        manualPagination
        pageIndex={page}
        pageCount={data?.pagination?.total_pages ?? 1}
        onPaginationChange={(p) => setPage(p)}
        totalRows={data?.pagination?.total}
        bulkActions={
          selected.length > 0 ? (
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="mr-2 size-4" />
              {t('actions.delete')} ({selected.length})
            </Button>
          ) : undefined
        }
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t('toast.deleteTitle')}
        description={t('toast.deleteDescription')}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        isLoading={deleteMut.isPending}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t('toast.deleteMultipleTitle')}
        description={t('toast.deleteMultipleDescription', { count: selected.length })}
        onConfirm={() => bulkDeleteMut.mutate(selected.map((p) => p._id))}
        isLoading={bulkDeleteMut.isPending}
      />
    </div>
  );
}
