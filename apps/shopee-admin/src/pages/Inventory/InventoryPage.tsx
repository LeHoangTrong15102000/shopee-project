import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 'src/components/ui/dialog'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import inventoryApi from 'src/apis/inventory.api'
import type { Product } from 'src/types'

export default function InventoryPage() {
  const qc = useQueryClient()
  const [updateProduct, setUpdateProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(0)

  const { data: lowStock, isLoading: loadingLow } = useQuery({
    queryKey: ['admin-inventory-low'],
    queryFn: () => inventoryApi.getLowStock({ limit: 50 }).then((r) => r.data.data),
  })
  const { data: outOfStock, isLoading: loadingOut } = useQuery({
    queryKey: ['admin-inventory-out'],
    queryFn: () => inventoryApi.getOutOfStock({ limit: 50 }).then((r) => r.data.data),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => inventoryApi.updateStock(id, { quantity: qty }),
    onSuccess: () => { toast.success('Stock updated'); setUpdateProduct(null); qc.invalidateQueries({ queryKey: ['admin-inventory-low'] }); qc.invalidateQueries({ queryKey: ['admin-inventory-out'] }) },
  })

  const columns: ColumnDef<Product>[] = [
    { accessorKey: 'image', header: '', cell: ({ row }) => <img src={row.original.image} alt="" className="size-10 rounded object-cover" />, enableSorting: false },
    { accessorKey: 'name', header: 'Product', cell: ({ row }) => <span className="max-w-[200px] truncate font-medium">{row.original.name}</span> },
    { accessorKey: 'quantity', header: 'Stock', cell: ({ row }) => <span className={row.original.quantity === 0 ? 'text-destructive font-medium' : 'text-yellow-600 font-medium'}>{row.original.quantity}</span> },
    { accessorKey: 'sold', header: 'Sold' },
    { accessorKey: 'price', header: 'Price', cell: ({ row }) => `₫${row.original.price.toLocaleString()}` },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => { setUpdateProduct(row.original); setQuantity(row.original.quantity) }}>Update Stock</Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Monitor and manage stock levels" />
      <Tabs defaultValue="low-stock">
        <TabsList>
          <TabsTrigger value="low-stock">Low Stock ({lowStock?.products?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="out-of-stock">Out of Stock ({outOfStock?.products?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="low-stock">
          <DataTable columns={columns} data={lowStock?.products ?? []} isLoading={loadingLow} searchKey="name" searchPlaceholder="Search products..." />
        </TabsContent>
        <TabsContent value="out-of-stock">
          <DataTable columns={columns} data={outOfStock?.products ?? []} isLoading={loadingOut} searchKey="name" searchPlaceholder="Search products..." />
        </TabsContent>
      </Tabs>

      <Dialog open={!!updateProduct} onOpenChange={(o) => !o && setUpdateProduct(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Stock: {updateProduct?.name}</DialogTitle></DialogHeader>
          <div><Label>New Quantity</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(+e.target.value)} min={0} /></div>
          <DialogFooter><Button onClick={() => updateProduct && updateMut.mutate({ id: updateProduct._id, qty: quantity })} disabled={updateMut.isPending}>Update</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

