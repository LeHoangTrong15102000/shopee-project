import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
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
import { useConversations, useDeleteConversation } from 'src/hooks/useConversations'
import type { Conversation } from 'src/apis/conversations.api'
import { ROUTES } from 'src/constants/routes'

export default function ConversationListPage() {
  const { t } = useTranslation('conversations')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedConversations, setSelectedConversations] = useState<Conversation[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const params = {
    page,
    limit: 20,
    ...(userSearch ? { user_id: userSearch } : {}),
    ...(status ? { status } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
  }

  const { data, isLoading, isError } = useConversations(params)
  const deleteMut = useDeleteConversation(() => setDeleteId(null))
  const bulkDeleteMut = useDeleteConversation(() => {
    setBulkDeleteOpen(false)
    setSelectedConversations([])
  })

  const columns: ColumnDef<Conversation>[] = [
    {
      accessorKey: '_id',
      header: t('columns.id'),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original._id.slice(-8)}</span>
      ),
    },
    {
      accessorKey: 'user',
      header: t('columns.user'),
      cell: ({ row }) => {
        const user = row.original.user
        if (typeof user === 'object') {
          return <span>{user.name || user.email}</span>
        }
        return <span className="font-mono text-xs">{String(user).slice(-8)}</span>
      },
    },
    {
      accessorKey: 'message_count',
      header: t('columns.messageCount'),
      cell: ({ row }) => row.original.message_count ?? row.original.messages?.length ?? 0,
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {t(`status.${row.original.status}`, { defaultValue: row.original.status })}
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.CONVERSATION_DETAIL.replace(':id', row.original._id))}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(row.original._id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const bulkActions = selectedConversations.length > 0 && (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setBulkDeleteOpen(true)}
      >
        <Trash2 className="mr-1 size-4" />
        {t('bulk.deleteSelected', { count: selectedConversations.length })}
      </Button>
    </div>
  )

  if (isError) return <ErrorState message={t('error')} />

  const totalPages = data?.pagination?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t('filter.userSearch')}
          value={userSearch}
          onChange={(e) => { setUserSearch(e.target.value); setPage(1) }}
          className="w-60"
        />
        <Select
          value={status || 'all'}
          onValueChange={(v) => { setStatus(v === 'all' || !v ? '' : v); setPage(1) }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('filter.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filter.allStatuses')}</SelectItem>
            <SelectItem value="active">{t('status.active')}</SelectItem>
            <SelectItem value="archived">{t('status.archived')}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          placeholder={t('filter.dateFrom')}
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="w-40"
          title={t('filter.dateFrom')}
        />
        <Input
          type="date"
          placeholder={t('filter.dateTo')}
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="w-40"
          title={t('filter.dateTo')}
        />
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
        enableRowSelection
        onRowSelectionChange={setSelectedConversations}
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
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(o) => !o && setBulkDeleteOpen(false)}
        title={t('bulk.deleteTitle')}
        description={t('bulk.deleteDescription', { count: selectedConversations.length })}
        onConfirm={() => {
          selectedConversations.forEach((c) => bulkDeleteMut.mutate(c._id))
        }}
        isLoading={bulkDeleteMut.isPending}
      />
    </div>
  )
}
