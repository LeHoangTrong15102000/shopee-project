import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye, Trash2, MoreHorizontal, Star, CheckCircle, Flag } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Badge } from 'src/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatCard } from 'src/components/shared/StatCard'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { ErrorState } from 'src/components/shared/ErrorState'
import { useReviews, useReviewStats, useDeleteReview } from 'src/hooks/useReviews'
import { useReviewModerationStore } from 'src/stores/review-moderation.store'
import type { Review } from 'src/types'

export default function ReviewListPage() {
  const { t } = useTranslation('reviews')
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { getStatus, setStatus } = useReviewModerationStore()

  const { data, isLoading, isError, refetch } = useReviews(page)
  const { data: stats } = useReviewStats()
  const deleteMut = useDeleteReview(() => setDeleteId(null))

  const columns: ColumnDef<Review>[] = [
    {
      accessorKey: 'product',
      header: t('columns.product'),
      cell: ({ row }) => (
        <span className="max-w-[150px] truncate">{row.original.product.name}</span>
      ),
    },
    {
      accessorKey: 'user',
      header: t('columns.user'),
      cell: ({ row }) => row.original.user.name || row.original.user.email,
    },
    {
      accessorKey: 'rating',
      header: t('columns.rating'),
      cell: ({ row }) => (
        <Badge variant="secondary">
          <Star className="mr-1 size-3" />
          {row.original.rating}
        </Badge>
      ),
    },
    {
      accessorKey: 'comment',
      header: t('columns.comment'),
      cell: ({ row }) => <span className="max-w-[200px] truncate">{row.original.comment}</span>,
    },
    { accessorKey: 'helpful_count', header: t('columns.likes') },
    {
      id: 'moderation',
      header: t('columns.moderation'),
      cell: ({ row }) => <StatusBadge status={getStatus(row.original._id)} />,
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" aria-label={t('common:aria.actions')} />}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/reviews/${row.original._id}`)}>
              <Eye className="mr-2 size-4" />
              {t('actions.view')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setStatus(row.original._id, 'approved')
                toast.success(t('toast.approved'))
              }}
            >
              <CheckCircle className="mr-2 size-4" />
              {t('actions.approve')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setStatus(row.original._id, 'flagged')
                toast.success(t('toast.flagged'))
              }}
            >
              <Flag className="mr-2 size-4" />
              {t('actions.flag')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original._id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={t('stats.totalReviews')} value={stats.total} />
          <StatCard
            label={t('stats.averageRating')}
            value={stats.average_rating?.toFixed(1) ?? '0'}
            icon={<Star className="size-4" />}
          />
          <StatCard
            label={t('stats.fiveStarReviews')}
            value={stats.rating_distribution?.['5'] ?? 0}
          />
        </div>
      )}
      {isError && <ErrorState message={t('error')} onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={data?.reviews ?? []}
        isLoading={isLoading}
        searchKey="comment"
        searchPlaceholder={t('search')}
        manualPagination
        pageIndex={page}
        pageCount={data?.pagination?.totalPages ?? 1}
        onPaginationChange={(p) => setPage(p)}
        totalRows={data?.pagination?.total}
      />
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
