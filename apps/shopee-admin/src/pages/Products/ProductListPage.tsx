import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Checkbox } from 'src/components/ui/checkbox';
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
import { formatCurrency } from 'src/utils/format';
import type { Product } from 'src/types';

export default function ProductListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Product[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useProducts(page);
  const deleteMut = useDeleteProduct(() => setDeleteId(null));
  const bulkDeleteMut = useDeleteManyProducts(() => {
    setBulkDeleteOpen(false);
    setSelected([]);
  });

  const columns: ColumnDef<Product>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
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
      header: 'Name',
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    { accessorKey: 'quantity', header: 'Stock' },
    { accessorKey: 'sold', header: 'Sold' },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const c = row.original.category;
        return typeof c === 'object' ? c.name : c;
      },
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => <Badge variant="secondary">{row.original.rating.toFixed(1)} ★</Badge>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Product actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/products/${row.original._id}`)}>
              <Eye className="mr-2 size-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/products/${row.original._id}/edit`)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
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
        title="Products"
        description="Manage your product catalog"
        actions={
          <Button size="sm" onClick={() => navigate('/products/new')}>
            <Plus className="mr-2 size-4" />
            Add Product
          </Button>
        }
      />
      {isError && <ErrorState message="Failed to load products" onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={data?.products ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search products..."
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
              Delete ({selected.length})
            </Button>
          ) : undefined
        }
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Product"
        description="This will permanently delete this product."
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        isLoading={deleteMut.isPending}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Products"
        description={`Delete ${selected.length} selected products?`}
        onConfirm={() => bulkDeleteMut.mutate(selected.map((p) => p._id))}
        isLoading={bulkDeleteMut.isPending}
      />
    </div>
  );
}
