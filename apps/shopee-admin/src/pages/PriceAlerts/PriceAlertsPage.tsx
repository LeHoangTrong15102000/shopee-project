import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Badge } from 'src/components/ui/badge'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { usePriceAlerts } from 'src/hooks/usePriceAlerts'
import { formatPrice } from '@shopee/shared-utils'
import type { PriceAlert } from 'src/apis/price-alerts.api'

function isNotFoundOrForbidden(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const status = (error as { response?: { status?: number } }).response?.status
  return status === 404 || status === 403
}

export default function PriceAlertsPage() {
  const { t } = useTranslation('price-alerts')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error } = usePriceAlerts(page)

  const columns: ColumnDef<PriceAlert>[] = [
    {
      accessorKey: 'user',
      header: t('columns.user'),
      cell: ({ row }) => {
        const user = row.original.user
        if (typeof user === 'object') return <span>{user.name || user.email}</span>
        return <span className="font-mono text-xs">{String(user).slice(-8)}</span>
      },
    },
    {
      accessorKey: 'product',
      header: t('columns.product'),
      cell: ({ row }) => {
        const product = row.original.product
        if (typeof product === 'object') return <span>{product.name}</span>
        return <span className="font-mono text-xs">{String(product).slice(-8)}</span>
      },
    },
    {
      accessorKey: 'target_price',
      header: t('columns.targetPrice'),
      cell: ({ row }) => formatPrice(row.original.target_price),
    },
    {
      accessorKey: 'current_price',
      header: t('columns.currentPrice'),
      cell: ({ row }) => formatPrice(row.original.current_price),
    },
    {
      accessorKey: 'is_triggered',
      header: t('columns.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.is_triggered ? 'default' : 'secondary'}>
          {row.original.is_triggered ? t('triggered') : t('pending')}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('columns.date'),
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
  ]

  const showBackendRequired = isError && isNotFoundOrForbidden(error)

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      {showBackendRequired ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">{t('backendRequired')}</p>
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">{t('error')}</p>
        </div>
      ) : (
        <>
          {!isLoading && (!data?.alerts || data.alerts.length === 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('emptyState')}</p>
          ) : (
            <DataTable
              columns={columns}
              data={data?.alerts ?? []}
              isLoading={isLoading}
              manualPagination
              pageIndex={page - 1}
              pageCount={data?.pagination?.totalPages ?? 1}
              onPaginationChange={(p) => setPage(p + 1)}
              totalRows={data?.pagination?.total}
            />
          )}
        </>
      )}
    </div>
  )
}
