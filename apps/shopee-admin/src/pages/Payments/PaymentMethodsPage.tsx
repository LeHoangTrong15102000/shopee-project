import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, ToggleLeft, ChevronUp, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import {
  usePaymentMethods,
  useDeletePaymentMethod,
  useTogglePaymentMethod,
  useReorderPaymentMethods,
} from 'src/hooks/usePayments'
import type { PaymentMethod } from 'src/types/payment.types'
import PaymentMethodDialog from 'src/pages/Payments/PaymentMethodDialog'
import PaymentDeleteDialog from 'src/pages/Payments/PaymentDeleteDialog'

export default function PaymentMethodsPage() {
  const { t } = useTranslation('payments')
  const { data, isLoading, isError, refetch } = usePaymentMethods()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null)
  const [deleteMethod, setDeleteMethod] = useState<PaymentMethod | null>(null)

  const toggleMut = useTogglePaymentMethod()
  const deleteMut = useDeletePaymentMethod(() => setDeleteMethod(null))
  const reorderMut = useReorderPaymentMethods()

  const methods = data ?? []

  function handleMoveUp(method: PaymentMethod) {
    const sorted = [...methods].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((m) => m._id === method._id)
    if (idx <= 0) return
    const prev = sorted[idx - 1]
    reorderMut.mutate([
      { id: method._id, sort_order: prev.sort_order },
      { id: prev._id, sort_order: method.sort_order },
    ])
  }

  function handleMoveDown(method: PaymentMethod) {
    const sorted = [...methods].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((m) => m._id === method._id)
    if (idx >= sorted.length - 1) return
    const next = sorted[idx + 1]
    reorderMut.mutate([
      { id: method._id, sort_order: next.sort_order },
      { id: next._id, sort_order: method.sort_order },
    ])
  }

  const columns: ColumnDef<PaymentMethod>[] = [
    {
      accessorKey: 'sort_order',
      header: t('columns.order'),
      cell: ({ row }) => {
        const sorted = [...methods].sort((a, b) => a.sort_order - b.sort_order)
        const idx = sorted.findIndex((m) => m._id === row.original._id)
        return (
          <div className="flex items-center gap-1">
            <span className="w-6 text-center text-sm text-muted-foreground">{row.original.sort_order}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={idx <= 0 || reorderMut.isPending}
              onClick={() => handleMoveUp(row.original)}
              aria-label={t('actions.moveUp')}
            >
              <ChevronUp className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={idx >= sorted.length - 1 || reorderMut.isPending}
              onClick={() => handleMoveDown(row.original)}
              aria-label={t('actions.moveDown')}
            >
              <ChevronDown className="size-3" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: 'icon',
      header: t('columns.icon'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.icon || '—'}</span>
      ),
    },
    { accessorKey: 'name', header: t('columns.name') },
    {
      accessorKey: 'type',
      header: t('columns.type'),
      cell: ({ row }) => (
        <Badge variant="outline">{t(`types.${row.original.type}`)}</Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: t('columns.description'),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block">{row.original.description ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: t('columns.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditMethod(row.original)
              setDialogOpen(true)
            }}
            aria-label={t('actions.edit')}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleMut.mutate(row.original._id)}
            disabled={toggleMut.isPending}
            aria-label={t('actions.toggle')}
          >
            <ToggleLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteMethod(row.original)}
            aria-label={t('actions.delete')}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditMethod(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 size-4" />
            {t('actions.create')}
          </Button>
        }
      />
      {isError && <ErrorState message={t('error')} onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={[...methods].sort((a, b) => a.sort_order - b.sort_order)}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder={t('search')}
      />

      <PaymentMethodDialog
        open={dialogOpen}
        method={editMethod}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditMethod(null)
        }}
      />

      <PaymentDeleteDialog
        open={!!deleteMethod}
        method={deleteMethod}
        onOpenChange={(open) => !open && setDeleteMethod(null)}
        onConfirm={() => deleteMethod && deleteMut.mutate(deleteMethod._id)}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}
