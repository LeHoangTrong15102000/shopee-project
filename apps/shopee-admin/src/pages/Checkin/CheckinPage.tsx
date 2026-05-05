import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatCard } from 'src/components/shared/StatCard'
import { useCheckinStats } from 'src/hooks/useCheckin'
import type { CheckinActivity } from 'src/apis/checkin.api'

function isNotFoundOrForbidden(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const status = (error as { response?: { status?: number } }).response?.status
  return status === 404 || status === 403
}

export default function CheckinPage() {
  const { t } = useTranslation('checkin')
  const { data, isLoading, isError, error } = useCheckinStats()

  const columns: ColumnDef<CheckinActivity>[] = [
    {
      accessorKey: 'user',
      header: t('activity.columns.user'),
      cell: ({ row }) => {
        const user = row.original.user
        if (typeof user === 'object') return <span>{user.name || user.email}</span>
        return <span className="font-mono text-xs">{String(user).slice(-8)}</span>
      },
    },
    {
      accessorKey: 'streak',
      header: t('activity.columns.streak'),
      cell: ({ row }) => row.original.streak,
    },
    {
      accessorKey: 'points_earned',
      header: t('activity.columns.pointsEarned'),
      cell: ({ row }) => row.original.points_earned,
    },
    {
      accessorKey: 'createdAt',
      header: t('activity.columns.date'),
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy HH:mm'),
    },
  ]

  const showBackendRequired = isError && isNotFoundOrForbidden(error)

  if (showBackendRequired) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">{t('backendRequired')}</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">{t('error')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t('stats.totalToday')}
          value={isLoading ? '—' : (data?.total_today ?? 0)}
        />
        <StatCard
          label={t('stats.activeStreaks')}
          value={isLoading ? '—' : (data?.active_streaks ?? 0)}
        />
      </div>
      <div className="space-y-2">
        <h2 className="text-base font-semibold">{t('activity.title')}</h2>
        {!isLoading && (!data?.recent_activity || data.recent_activity.length === 0) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('emptyState')}</p>
        ) : (
          <DataTable
            columns={columns}
            data={data?.recent_activity ?? []}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}
