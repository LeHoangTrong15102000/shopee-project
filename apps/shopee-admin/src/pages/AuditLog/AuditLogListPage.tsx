import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye, MoreHorizontal, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from 'src/components/ui/tabs'
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
import { StatusBadge } from 'src/components/shared/StatusBadge'
import { ErrorState } from 'src/components/shared/ErrorState'
import { FilterPanel } from 'src/components/shared/FilterPanel'
import { useAuditLogList } from 'src/hooks/useAuditLog'
import { exportToCSV } from 'src/utils/csv-export'
import auditLogApi from 'src/apis/audit-log.api'
import { ROUTES } from 'src/constants/routes'
import type { AuditLogItem, AuditLogStatus } from 'src/types/audit-log'

type StatusTab = AuditLogStatus | 'all'

const ACTION_OPTIONS = [
  'user.login',
  'user.logout',
  'user.create',
  'user.update',
  'user.delete',
  'product.create',
  'product.update',
  'product.delete',
  'order.status_change',
  'order.cancel',
  'voucher.create',
  'voucher.update',
]

const RESOURCE_OPTIONS = ['user', 'product', 'order', 'voucher', 'category', 'review', 'setting']

export default function AuditLogListPage() {
  const { t } = useTranslation('activity-log')
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [action, setAction] = useState('')
  const [resource, setResource] = useState('')
  const [actorId, setActorId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const params = {
    page: page + 1,
    limit: 20,
    ...(statusTab !== 'all' && { status: statusTab }),
    ...(action && { action }),
    ...(resource && { resource }),
    ...(actorId && { actorId }),
    ...(dateFrom && { from: dateFrom }),
    ...(dateTo && { to: dateTo }),
  }

  const { data, isLoading, isError, refetch } = useAuditLogList(params)

  const handleStatusChange = (v: string) => {
    setStatusTab(v as StatusTab)
    setPage(0)
  }

  const handleClearFilters = () => {
    setAction('')
    setResource('')
    setActorId('')
    setDateFrom('')
    setDateTo('')
    setPage(0)
  }

  const handleExportCSV = async () => {
    const filterParams = {
      ...(statusTab !== 'all' && { status: statusTab }),
      ...(action && { action }),
      ...(resource && { resource }),
      ...(actorId && { actorId }),
      ...(dateFrom && { from: dateFrom }),
      ...(dateTo && { to: dateTo }),
      page: 1,
      limit: 1000,
    }
    const res = await auditLogApi.getList(filterParams)
    const allItems = res.data.data.items
    exportToCSV(
      allItems,
      [
        { key: '_id', header: t('columns.timestamp'), accessor: (r) => format(new Date(r.timestamp), 'yyyy-MM-dd HH:mm:ss') },
        { key: 'action', header: t('columns.action') },
        { key: 'resource', header: t('columns.resource') },
        {
          key: 'actor',
          header: t('columns.actor'),
          accessor: (r) => r.actor.userId,
        },
        { key: 'ip', header: t('columns.ip') },
        { key: 'status', header: t('columns.status') },
      ],
      'audit-log',
    )
  }

  const columns: ColumnDef<AuditLogItem>[] = [
    {
      accessorKey: 'timestamp',
      header: t('columns.timestamp'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.timestamp), 'MMM d, yyyy HH:mm:ss')}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      header: t('columns.action'),
      cell: ({ row }) => {
        const parts = row.original.action.split('.')
        const category = parts[0] ?? ''
        const colorMap: Record<string, string> = {
          user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          product: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          order: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          voucher: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        }
        const cls = colorMap[category] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        return (
          <Badge className={`font-mono text-xs ${cls}`} variant="outline">
            {row.original.action}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'resource',
      header: t('columns.resource'),
      cell: ({ row }) => <span className="capitalize">{row.original.resource}</span>,
    },
    {
      accessorKey: 'actor',
      header: t('columns.actor'),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.actor.userId}</span>
      ),
    },
    {
      accessorKey: 'ip',
      header: t('columns.ip'),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.ip}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" aria-label="actions" />}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(`${ROUTES.AUDIT_LOG}/${row.original._id}`)}
            >
              <Eye className="mr-2 size-4" />
              {t('actions.viewDetail')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 size-4" />
            {t('export.exportCsv')}
          </Button>
        }
      />
      <FilterPanel onClear={handleClearFilters}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="filter-action">{t('filters.action')}</Label>
            <Select
              value={action}
              onValueChange={(v) => {
                setAction(v === '__all__' ? '' : v)
                setPage(0)
              }}
            >
              <SelectTrigger id="filter-action">
                <SelectValue placeholder={t('filters.action')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">—</SelectItem>
                {ACTION_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-resource">{t('filters.resource')}</Label>
            <Select
              value={resource}
              onValueChange={(v) => {
                setResource(v === '__all__' ? '' : v)
                setPage(0)
              }}
            >
              <SelectTrigger id="filter-resource">
                <SelectValue placeholder={t('filters.resource')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">—</SelectItem>
                {RESOURCE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-actor-id">{t('filters.actorId')}</Label>
            <Input
              id="filter-actor-id"
              value={actorId}
              onChange={(e) => {
                setActorId(e.target.value)
                setPage(0)
              }}
              placeholder={t('filters.actorId')}
            />
          </div>
          <div>
            <Label htmlFor="filter-date-from">{t('filters.dateFrom')}</Label>
            <Input
              id="filter-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <div>
            <Label htmlFor="filter-date-to">{t('filters.dateTo')}</Label>
            <Input
              id="filter-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(0)
              }}
            />
          </div>
        </div>
      </FilterPanel>
      <Tabs value={statusTab} onValueChange={handleStatusChange}>
        <TabsList>
          <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
          <TabsTrigger value="success">{t('tabs.success')}</TabsTrigger>
          <TabsTrigger value="failed">{t('tabs.failed')}</TabsTrigger>
        </TabsList>
      </Tabs>
      {isError && <ErrorState message={t('error')} onRetry={refetch} />}
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        manualPagination
        pageIndex={page}
        pageCount={data?.pagination?.totalPages ?? 1}
        onPaginationChange={(p) => setPage(p)}
        totalRows={data?.pagination?.total}
      />
    </div>
  )
}
