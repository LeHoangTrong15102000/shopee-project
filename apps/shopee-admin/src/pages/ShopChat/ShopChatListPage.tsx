import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye, Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Switch } from 'src/components/ui/switch'
import { Label } from 'src/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog'
import { Textarea } from 'src/components/ui/textarea'
import shopChatApi from 'src/apis/shop-chat.api'
import type { ShopConversation } from 'src/types/shop-chat.types'
import { ROUTES } from 'src/constants/routes'

export default function ShopChatListPage() {
  const { t } = useTranslation('shop-chat')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [shopSearch, setShopSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [flaggedOnly, setFlaggedOnly] = useState(false)

  // Flag dialog state
  const [flagTarget, setFlagTarget] = useState<ShopConversation | null>(null)
  const [flagReason, setFlagReason] = useState('')

  const params = {
    page,
    limit: 20,
    ...(shopSearch ? { shop_id: shopSearch } : {}),
    ...(userSearch ? { user_id: userSearch } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
    ...(flaggedOnly ? { flagged: true } : {}),
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-shop-conversations', params],
    queryFn: () => shopChatApi.getAdminShopConversations(params).then((r) => r.data.data),
  })

  const flagMut = useMutation({
    mutationFn: ({ id, flagged, reason }: { id: string; flagged: boolean; reason?: string }) =>
      shopChatApi.flagConversation(id, { flagged, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shop-conversations'] })
      setFlagTarget(null)
      setFlagReason('')
    },
  })

  function getShopName(conv: ShopConversation): string {
    if (typeof conv.shopId === 'object') return conv.shopId.name
    return String(conv.shopId).slice(-8)
  }

  function getUserName(conv: ShopConversation): string {
    if (typeof conv.userId === 'object') {
      return conv.userId.name || conv.userId.email
    }
    return String(conv.userId).slice(-8)
  }

  const columns: ColumnDef<ShopConversation>[] = [
    {
      accessorKey: 'shopId',
      header: t('columns.shop'),
      cell: ({ row }) => (
        <span className="font-medium">{getShopName(row.original)}</span>
      ),
    },
    {
      accessorKey: 'userId',
      header: t('columns.user'),
      cell: ({ row }) => <span>{getUserName(row.original)}</span>,
    },
    {
      accessorKey: 'lastMessage',
      header: t('columns.lastMessage'),
      cell: ({ row }) => {
        const msg = row.original.lastMessage
        if (!msg) return <span className="text-muted-foreground text-xs">{t('noMessages')}</span>
        return (
          <span className="line-clamp-1 max-w-xs text-sm text-muted-foreground">
            {msg.content}
          </span>
        )
      },
    },
    {
      accessorKey: 'message_count',
      header: t('columns.messageCount'),
      cell: ({ row }) => row.original.message_count,
    },
    {
      accessorKey: 'updatedAt',
      header: t('columns.lastActivity'),
      cell: ({ row }) => format(new Date(row.original.updatedAt), 'MMM d, yyyy HH:mm'),
    },
    {
      accessorKey: 'flagged',
      header: t('columns.flagged'),
      cell: ({ row }) =>
        row.original.flagged ? (
          <Badge variant="destructive" className="text-xs">
            {t('flagged')}
          </Badge>
        ) : null,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(ROUTES.SHOP_CHAT_DETAIL.replace(':id', row.original._id), {
                state: { conversation: row.original },
              })
            }
            aria-label={t('actions.view')}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFlagTarget(row.original)
              setFlagReason(row.original.flag_reason ?? '')
            }}
            aria-label={row.original.flagged ? t('actions.unflag') : t('actions.flag')}
            className={row.original.flagged ? 'text-destructive hover:text-destructive' : ''}
          >
            <Flag className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isError) return <ErrorState message={t('error')} />

  const totalPages = data?.pagination?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder={t('filter.shopSearch')}
          value={shopSearch}
          onChange={(e) => { setShopSearch(e.target.value); setPage(1) }}
          className="w-52"
        />
        <Input
          placeholder={t('filter.userSearch')}
          value={userSearch}
          onChange={(e) => { setUserSearch(e.target.value); setPage(1) }}
          className="w-52"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="w-40"
          title={t('filter.dateFrom')}
          aria-label={t('filter.dateFrom')}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="w-40"
          title={t('filter.dateTo')}
          aria-label={t('filter.dateTo')}
        />
        <div className="flex items-center gap-2">
          <Switch
            id="flagged-only"
            checked={flaggedOnly}
            onCheckedChange={(v) => { setFlaggedOnly(v); setPage(1) }}
          />
          <Label htmlFor="flagged-only" className="text-sm cursor-pointer">
            {t('filter.flaggedOnly')}
          </Label>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.conversations ?? []}
        isLoading={isLoading}
        manualPagination
        pageIndex={page - 1}
        pageCount={totalPages}
        onPaginationChange={(p) => setPage(p + 1)}
        totalRows={data?.pagination?.total}
      />

      {/* Flag dialog */}
      <Dialog
        open={!!flagTarget}
        onOpenChange={(open) => {
          if (!open) {
            setFlagTarget(null)
            setFlagReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {flagTarget?.flagged ? t('flagDialog.unflagTitle') : t('flagDialog.flagTitle')}
            </DialogTitle>
          </DialogHeader>
          {!flagTarget?.flagged && (
            <div className="space-y-2">
              <Label htmlFor="flag-reason">{t('flagDialog.reason')}</Label>
              <Textarea
                id="flag-reason"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder={t('flagDialog.reasonPlaceholder')}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFlagTarget(null)
                setFlagReason('')
              }}
            >
              {t('flagDialog.cancel')}
            </Button>
            <Button
              variant={flagTarget?.flagged ? 'default' : 'destructive'}
              onClick={() => {
                if (!flagTarget) return
                flagMut.mutate({
                  id: flagTarget._id,
                  flagged: !flagTarget.flagged,
                  reason: flagReason || undefined,
                })
              }}
              disabled={flagMut.isPending}
            >
              {flagTarget?.flagged ? t('flagDialog.unflagConfirm') : t('flagDialog.flagConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
