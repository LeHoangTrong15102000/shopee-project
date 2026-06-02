import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye, Trash2, MoreHorizontal, Star, CheckCircle, Flag, RotateCcw } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Badge } from 'src/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'
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
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { ErrorState } from 'src/components/shared/ErrorState'
import {
  useReviews,
  useReviewStats,
  useDeleteReview,
  useModerateReview,
} from 'src/hooks/useReviews'
import type { Review } from 'src/types'
import type { ModerationStatus } from 'src/apis/reviews.api'

export default function ReviewListPage() {
  const { t } = useTranslation('reviews')
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [moderationFilter, setModerationFilter] = useState<ModerationStatus | 'all'>('all')
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([])

  const reviewParams = {
    page,
    ...(moderationFilter !== 'all' ? { moderation_status: moderationFilter } : {}),
  }

  const { data, isLoading, isError, refetch } = useReviews(reviewParams)
  const { data: stats } = useReviewStats()
  const deleteMut = useDeleteReview(() => setDeleteId(null))
  const moderateMut = useModerateReview()

  function getModerationBadgeVariant(status?: string) {
    if (status === 'approved') return 'approved'
    if (status === 'flagged') return 'flagged'
    return 'pending'
  }

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
      cell: ({ row }) => (
        <StatusBadge status={getModerationBadgeVariant(row.original.moderation_status)} />
      ),
    },
    {
      id: 'moderationActions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            title={t('actions.approve')}
            onClick={() => moderateMut.mutate({ id: row.original._id, status: 'approved' })}
            disabled={row.original.moderation_status === 'approved'}
          >
            <CheckCircle className="size-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title={t('actions.flag')}
            onClick={() => moderateMut.mutate({ id: row.original._id, status: 'flagged' })}
            disabled={row.original.moderation_status === 'flagged'}
          >
            <Flag className="size-4 text-amber-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title={t('actions.resetPending')}
            onClick={() => moderateMut.mutate({ id: row.original._id, status: 'pending' })}
            disabled={
              row.original.moderation_status === 'pending' || !row.original.moderation_status
            }
          >
            <RotateCcw className="size-4 text-muted-foreground" />
          </Button>
        </div>
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

  const bulkActions = selectedReviews.length > 0 && (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          selectedReviews.forEach((r) => moderateMut.mutate({ id: r._id, status: 'approved' }))
          setSelectedReviews([])
        }}
      >
        <CheckCircle className="mr-1 size-4 text-green-600" />
        {t('bulk.approveAll')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          selectedReviews.forEach((r) => moderateMut.mutate({ id: r._id, status: 'flagged' }))
          setSelectedReviews([])
        }}
      >
        <Flag className="mr-1 size-4 text-amber-600" />
        {t('bulk.flagAll')}
      </Button>
    </div>
  )

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
      {stats?.moderation_counts && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={t('moderation.pending')} value={stats.moderation_counts.pending} />
          <StatCard label={t('moderation.approved')} value={stats.moderation_counts.approved} />
          <StatCard label={t('moderation.flagged')} value={stats.moderation_counts.flagged} />
        </div>
      )}
      <div className="flex items-center gap-3">
        <Select
          value={moderationFilter}
          onValueChange={(v) => {
            setModerationFilter(v as ModerationStatus | 'all')
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filter.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filter.allStatuses')}</SelectItem>
            <SelectItem value="pending">{t('filter.pending')}</SelectItem>
            <SelectItem value="approved">{t('filter.approved')}</SelectItem>
            <SelectItem value="flagged">{t('filter.flagged')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
        enableRowSelection
        onRowSelectionChange={setSelectedReviews}
        bulkActions={bulkActions || undefined}
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
