import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye, MoreHorizontal, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from 'src/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Textarea } from 'src/components/ui/textarea'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { ErrorState } from 'src/components/shared/ErrorState'
import shopsApi from 'src/apis/shops.api'
import type { ShopAdmin, ShopStatus, UpdateShopStatusBody } from 'src/types/shop.types'
import { formatPrice } from '@shopee/shared-utils'
import { ROUTES } from 'src/constants/routes'

const SHOP_STATUS_OPTIONS: ShopStatus[] = ['pending', 'active', 'suspended', 'banned']

export default function ShopListPage() {
  const { t } = useTranslation('shops')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [statusDialog, setStatusDialog] = useState<{
    shop: ShopAdmin
    newStatus: ShopStatus
  } | null>(null)
  const [statusReason, setStatusReason] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-shops', page, search, statusFilter, sortBy],
    queryFn: () =>
      shopsApi
        .getAdminShops({
          page: page + 1,
          limit: 20,
          search: search || undefined,
          status: statusFilter !== 'all' ? (statusFilter as ShopStatus) : undefined,
          sort_by: sortBy,
        })
        .then((r) => r.data.data),
  })

  const updateStatusMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateShopStatusBody }) =>
      shopsApi.updateShopStatus(id, body),
    onSuccess: () => {
      toast.success(t('statusUpdated'))
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      setStatusDialog(null)
      setStatusReason('')
    },
    onError: () => toast.error(tc('states.somethingWentWrong')),
  })

  const handleStatusChange = (shop: ShopAdmin, newStatus: ShopStatus) => {
    setStatusDialog({ shop, newStatus })
    setStatusReason('')
  }

  const confirmStatusChange = () => {
    if (!statusDialog) return
    const needsReason =
      statusDialog.newStatus === 'suspended' || statusDialog.newStatus === 'banned'
    if (needsReason && !statusReason.trim()) return

    updateStatusMut.mutate({
      id: statusDialog.shop._id,
      body: {
        status: statusDialog.newStatus,
        reason: statusReason.trim() || undefined,
      },
    })
  }

  const columns: ColumnDef<ShopAdmin>[] = [
    {
      id: 'shop',
      header: t('columns.shop'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={row.original.avatar} alt={row.original.name} />
            <AvatarFallback>
              <Store className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(row.original.joinedDate), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'owner',
      header: t('columns.owner'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.owner ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'productCount',
      header: t('columns.products'),
      cell: ({ row }) => row.original.productCount.toLocaleString(),
    },
    {
      accessorKey: 'revenue',
      header: t('columns.revenue'),
      cell: ({ row }) =>
        row.original.revenue != null
          ? formatPrice(row.original.revenue)
          : '—',
    },
    {
      accessorKey: 'followerCount',
      header: t('columns.followers'),
      cell: ({ row }) => row.original.followerCount.toLocaleString(),
    },
    {
      accessorKey: 'rating',
      header: t('columns.rating'),
      cell: ({ row }) => row.original.rating.toFixed(1),
    },
    {
      accessorKey: 'createdAt',
      header: t('columns.created'),
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" aria-label={tc('aria.actions')} />}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(ROUTES.SHOP_DETAIL.replace(':id', row.original._id))}
            >
              <Eye className="mr-2 size-4" />
              {tc('buttons.view')}
            </DropdownMenuItem>
            {SHOP_STATUS_OPTIONS.filter((s) => s !== row.original.status).map((s) => (
              <DropdownMenuItem key={s} onClick={() => handleStatusChange(row.original, s)}>
                {t(`actions.setStatus.${s}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (isError) return <ErrorState message={t('error')} onRetry={refetch} />

  const needsReason =
    statusDialog?.newStatus === 'suspended' || statusDialog?.newStatus === 'banned'

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t('filters.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(val) => val !== null && setStatusFilter(val)}>
          <SelectTrigger className="w-40" aria-label={t('filters.status')}>
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            {SHOP_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {tc(`statuses.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(val) => val !== null && setSortBy(val)}>
          <SelectTrigger className="w-48" aria-label={t('filters.sortBy')}>
            <SelectValue placeholder={t('filters.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">{t('filters.sortOptions.createdAt')}</SelectItem>
            <SelectItem value="products_count">{t('filters.sortOptions.products')}</SelectItem>
            <SelectItem value="followers_count">{t('filters.sortOptions.followers')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        pageIndex={page}
        pageCount={data?.pagination.totalPages ?? 1}
        onPaginationChange={(page) => setPage(page)}
        totalRows={data?.pagination.total ?? 0}
        manualPagination
      />

      <Dialog
        open={!!statusDialog}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialog(null)
            setStatusReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('statusDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {t('statusDialog.description', {
                shop: statusDialog?.shop.name,
                status: statusDialog ? tc(`statuses.${statusDialog.newStatus}`) : '',
              })}
            </p>
            {needsReason && (
              <div className="space-y-2">
                <Label htmlFor="status-reason">{t('statusDialog.reason')}</Label>
                <Textarea
                  id="status-reason"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={t('statusDialog.reasonPlaceholder')}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialog(null)
                setStatusReason('')
              }}
            >
              {tc('buttons.cancel')}
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={
                updateStatusMut.isPending || (needsReason && !statusReason.trim())
              }
            >
              {tc('buttons.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
