import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ColumnDef } from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'
import { Checkbox } from 'src/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import {
  useLowStock,
  useOutOfStock,
  useUpdateStock,
  useBulkUpdateStock,
} from 'src/hooks/useInventory'
import { formatCurrency } from 'src/utils/format'
import type { Product } from 'src/types'

export default function InventoryPage() {
  const { t } = useTranslation('inventory')
  const { t: tc } = useTranslation('common')
  const [updateProduct, setUpdateProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(0)
  const [selected, setSelected] = useState<Product[]>([])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkQty, setBulkQty] = useState(0)

  const {
    data: lowStock,
    isLoading: loadingLow,
    isError: lowError,
    refetch: refetchLow,
  } = useLowStock()
  const {
    data: outOfStock,
    isLoading: loadingOut,
    isError: outError,
    refetch: refetchOut,
  } = useOutOfStock()

  const updateMut = useUpdateStock(() => setUpdateProduct(null))
  const bulkUpdateMut = useBulkUpdateStock(() => {
    setBulkOpen(false)
    setSelected([])
  })

  const columns: ColumnDef<Product>[] = [
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
      header: t('columns.product'),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: t('columns.stock'),
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
    { accessorKey: 'sold', header: t('columns.sold') },
    {
      accessorKey: 'price',
      header: t('columns.price'),
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
            setUpdateProduct(row.original)
            setQuantity(row.original.quantity)
          }}
        >
          {t('actions.updateStock')}
        </Button>
      ),
    },
  ]

  const bulkActions =
    selected.length > 0 ? (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setBulkOpen(true)
          setBulkQty(0)
        }}
      >
        <RefreshCw className="mr-2 size-4" />
        {t('actions.bulkUpdate')} ({selected.length})
      </Button>
    ) : undefined

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <Tabs defaultValue="low-stock">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap scroll-p-1">
          <TabsTrigger value="low-stock">
            {t('lowStockCount', { count: lowStock?.products?.length ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="out-of-stock">
            {t('outOfStockCount', { count: outOfStock?.products?.length ?? 0 })}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="low-stock">
          {lowError && <ErrorState message={t('error')} onRetry={refetchLow} />}
          <DataTable
            columns={columns}
            data={lowStock?.products ?? []}
            isLoading={loadingLow}
            searchKey="name"
            searchPlaceholder={t('search')}
            enableRowSelection
            onRowSelectionChange={setSelected}
            bulkActions={bulkActions}
          />
        </TabsContent>
        <TabsContent value="out-of-stock">
          {outError && <ErrorState message={t('outOfStockError')} onRetry={refetchOut} />}
          <DataTable
            columns={columns}
            data={outOfStock?.products ?? []}
            isLoading={loadingOut}
            searchKey="name"
            searchPlaceholder={t('search')}
            enableRowSelection
            onRowSelectionChange={setSelected}
            bulkActions={bulkActions}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!updateProduct} onOpenChange={(o) => !o && setUpdateProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('actions.updateStock')}: {updateProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-qty">{t('actions.newQuantity')}</Label>
              <Input
                id="inv-qty"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(+e.target.value)}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                updateProduct && updateMut.mutate({ id: updateProduct._id, qty: quantity })
              }
              disabled={updateMut.isPending}
            >
              {tc('buttons.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('actions.bulkUpdate')} ({selected.length} products)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-bulk-qty">{t('actions.setQuantity')}</Label>
              <Input
                id="inv-bulk-qty"
                type="number"
                value={bulkQty}
                onChange={(e) => setBulkQty(+e.target.value)}
                min={0}
              />
            </div>
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
              {t('actions.updateAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
