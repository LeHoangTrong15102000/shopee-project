import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Trash2, Bell, Zap, Archive } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatCard } from 'src/components/shared/StatCard'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { usePriceAlerts, usePriceAlertStats, useDeleteAlert } from 'src/hooks/usePriceAlerts'
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
  const [productSearch, setProductSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [status, setStatus] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const params = {
    page,
    limit: 20,
    ...(productSearch ? { product_id: productSearch } : {}),
    ...(userSearch ? { user_id: userSearch } : {}),
    ...(status ? { status: status as 'active' | 'triggered' | 'expired' } : {}),
  }

  const { data, isLoading, isError, error } = usePriceAlerts(params)
  const { data: stats } = usePriceAlertStats()
  const deleteMut = useDeleteAlert(() => setDeleteId(null))

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
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteId(row.original._id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ]

  const showBackendRequired = isError && isNotFoundOrForbidden(error)

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label={t('stats.totalActive')}
            value={stats.total_active}
            icon={<Bell className="size-4" />}
          />
          <StatCard
            label={t('stats.triggeredToday')}
            value={stats.triggered_today}
            icon={<Zap className="size-4" />}
          />
          <StatCard
            label={t('stats.expired')}
            value={stats.expired}
            icon={<Archive className="size-4" />}
          />
        </div>
      )}

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
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder={t('filter.productSearch')}
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value)
                setPage(1)
              }}
              className="w-60"
            />
            <Input
              placeholder={t('filter.userSearch')}
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value)
                setPage(1)
              }}
              className="w-60"
            />
            <Select
              value={status || 'all'}
              onValueChange={(v) => {
                setStatus(v === 'all' || !v ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('filter.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('filter.active')}</SelectItem>
                <SelectItem value="triggered">{t('filter.triggered')}</SelectItem>
                <SelectItem value="expired">{t('filter.expired')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {stats && stats.most_watched_products.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold">{t('mostWatched.title')}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stats.most_watched_products.map((p) => (
                  <div key={p.product_id} className="flex items-center gap-3 rounded-lg border p-3">
                    {p.product_image && (
                      <img
                        src={p.product_image}
                        alt={p.product_name}
                        className="size-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{p.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('mostWatched.alertCount', { count: p.alert_count })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t('toast.deleteTitle')}
        description={t('toast.deleteDescription')}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}
