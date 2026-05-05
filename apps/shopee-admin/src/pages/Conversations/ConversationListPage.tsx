import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useConversations } from 'src/hooks/useConversations'
import type { Conversation } from 'src/apis/conversations.api'
import { ROUTES } from 'src/constants/routes'

export default function ConversationListPage() {
  const { t } = useTranslation('conversations')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useConversations(page)

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
          {t(`status.${row.original.status}`)}
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
          onClick={() => navigate(ROUTES.CONVERSATION_DETAIL.replace(':id', row.original._id))}
        >
          <Eye className="size-4" />
        </Button>
      ),
    },
  ]

  if (isError) return <ErrorState message={t('error')} />

  const totalPages = data?.pagination?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <DataTable
        columns={columns}
        data={data?.conversations ?? []}
        isLoading={isLoading}
      />
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
