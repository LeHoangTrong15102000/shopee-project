import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { Badge } from 'src/components/ui/badge'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import { usePaymentMethods } from 'src/hooks/usePayments'
import type { PaymentMethod } from 'src/apis/payments.api'

export default function PaymentMethodsPage() {
  const { t } = useTranslation('payments')
  const { data, isLoading, isError } = usePaymentMethods()

  const columns: ColumnDef<PaymentMethod>[] = [
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
      accessorKey: 'is_enabled',
      header: t('columns.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.is_enabled ? 'default' : 'secondary'}>
          {row.original.is_enabled ? t('enabled') : t('disabled')}
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
