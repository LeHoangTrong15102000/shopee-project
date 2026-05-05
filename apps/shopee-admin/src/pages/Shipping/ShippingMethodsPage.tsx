import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { Badge } from 'src/components/ui/badge'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import { useShippingMethods } from 'src/hooks/useShipping'
import { formatPrice } from '@shopee/shared-utils'
import type { ShippingMethod } from 'src/apis/shipping.api'

export default function ShippingMethodsPage() {
  const { t } = useTranslation('shipping')
  const { data, isLoading, isError } = useShippingMethods()

  const columns: ColumnDef<ShippingMethod>[] = [
    { accessorKey: 'name', header: t('columns.name') },
    { accessorKey: 'code', header: t('columns.code') },
    {
      accessorKey: 'description',
      header: t('columns.description'),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate">{row.original.description ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'base_cost',
      header: t('columns.baseCost'),
      cell: ({ row }) => formatPrice(row.original.base_cost),
    },
    {
      accessorKey: 'estimated_days',
      header: t('columns.estimatedDays'),
      cell: ({ row }) => row.original.estimated_days,
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
  ]

  if (isError) return <ErrorState message={t('error')} />

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      {!isLoading && (!data || data.length === 0) ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('emptyState')}</p>
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
