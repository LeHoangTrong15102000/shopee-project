import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { Checkbox } from 'src/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { DataTable } from 'src/components/shared/DataTable';
import { PageHeader } from 'src/components/shared/PageHeader';
import { ErrorState } from 'src/components/shared/ErrorState';
import {
  useLowStock,
  useOutOfStock,
  useUpdateStock,
  useBulkUpdateStock,
} from 'src/hooks/useInventory';
import { formatCurrency } from 'src/utils/format';
import type { Product } from 'src/types';

export default function InventoryPage() {
  const [updateProduct, setUpdateProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [selected, setSelected] = useState<Product[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkQty, setBulkQty] = useState(0);

  const {
    data: lowStock,
    isLoading: loadingLow,
    isError: lowError,
    refetch: refetchLow,
  } = useLowStock();
  const {
    data: outOfStock,
    isLoading: loadingOut,
    isError: outError,
    refetch: refetchOut,
  } = useOutOfStock();

  const updateMut = useUpdateStock(() => setUpdateProduct(null));
  const bulkUpdateMut = useBulkUpdateStock(() => {
    setBulkOpen(false);
    setSelected([]);
  });

  const columns: ColumnDef<Product>[] = [
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
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
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
      header: 'Product',
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Stock',
      cell: ({ row }) => (
        <span
          className={
            row.original.quantity === 0
              ? 'text-destructive font-medium'
              : 'text-yellow-600 font-medium'
          }
        >
          {row.original.quantity}
        </span>
      ),
    },
    { accessorKey: 'sold', header: 'Sold' },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setUpdateProduct(row.original);
            setQuantity(row.original.quantity);
          }}
        >
          Update Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Monitor and manage stock levels" />
      <Tabs defaultValue="low-stock">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap scroll-p-1">
          <TabsTrigger value="low-stock">Low Stock ({lowStock?.products?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="out-of-stock">
            Out of Stock ({outOfStock?.products?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="low-stock">
          {lowError && <ErrorState message="Failed to load low stock items" onRetry={refetchLow} />}
          <DataTable
            columns={columns}
            data={lowStock?.products ?? []}
            isLoading={loadingLow}
            searchKey="name"
            searchPlaceholder="Search products..."
            enableRowSelection
            onRowSelectionChange={setSelected}
            bulkActions={
              selected.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkOpen(true);
                    setBulkQty(0);
                  }}
                >
                  <Trash2 className="mr-2 size-4" />
                  Bulk Update ({selected.length})
                </Button>
              ) : undefined
            }
          />
        </TabsContent>
        <TabsContent value="out-of-stock">
          {outError && (
            <ErrorState message="Failed to load out of stock items" onRetry={refetchOut} />
          )}
          <DataTable
            columns={columns}
            data={outOfStock?.products ?? []}
            isLoading={loadingOut}
            searchKey="name"
            searchPlaceholder="Search products..."
            enableRowSelection
            onRowSelectionChange={setSelected}
            bulkActions={
              selected.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkOpen(true);
                    setBulkQty(0);
                  }}
                >
                  <Trash2 className="mr-2 size-4" />
                  Bulk Update ({selected.length})
                </Button>
              ) : undefined
            }
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!updateProduct} onOpenChange={(o) => !o && setUpdateProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock: {updateProduct?.name}</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="inv-qty">New Quantity</Label>
            <Input
              id="inv-qty"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(+e.target.value)}
              min={0}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                updateProduct && updateMut.mutate({ id: updateProduct._id, qty: quantity })
              }
              disabled={updateMut.isPending}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Stock ({selected.length} products)</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="inv-bulk-qty">Set Quantity</Label>
            <Input
              id="inv-bulk-qty"
              type="number"
              value={bulkQty}
              onChange={(e) => setBulkQty(+e.target.value)}
              min={0}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                bulkUpdateMut.mutate(
                  selected.map((p) => ({ product_id: p._id, quantity: bulkQty })),
                )
              }
              disabled={bulkUpdateMut.isPending}
            >
              Update All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
