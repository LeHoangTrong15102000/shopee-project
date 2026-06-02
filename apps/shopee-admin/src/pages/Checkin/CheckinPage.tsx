import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Medal } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'src/components/ui/chart'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { StatCard } from 'src/components/shared/StatCard'
import { Input } from 'src/components/ui/input'
import {
  useCheckinStats,
  useCheckinUsers,
  useCheckinLeaderboard,
  useCheckinDailyStats,
} from 'src/hooks/useCheckin'
import type { CheckinUserStat, CheckinLeaderboardEntry } from 'src/apis/checkin.api'

function isNotFoundOrForbidden(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const status = (error as { response?: { status?: number } }).response?.status
  return status === 404 || status === 403
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="size-5 text-yellow-500" />
  if (rank === 2) return <Medal className="size-5 text-slate-400" />
  if (rank === 3) return <Medal className="size-5 text-amber-600" />
  return <span className="w-5 text-center text-sm font-medium text-muted-foreground">{rank}</span>
}

export default function CheckinPage() {
  const { t } = useTranslation('checkin')
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)

  const { data: stats, isError: statsError, error: statsErr } = useCheckinStats()
  const { data: dailyStats, isLoading: dailyLoading } = useCheckinDailyStats()
  const { data: usersData, isLoading: usersLoading } = useCheckinUsers({
    page: userPage,
    limit: 20,
    ...(userSearch ? { search: userSearch } : {}),
  })
  const { data: leaderboard, isLoading: lbLoading } = useCheckinLeaderboard()

  const showBackendRequired = statsError && isNotFoundOrForbidden(statsErr)

  const userColumns: ColumnDef<CheckinUserStat>[] = [
    {
      id: 'user',
      header: t('tabs.users.columns.user'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={row.original.user_avatar} alt={row.original.user_name} />
            <AvatarFallback>{row.original.user_name?.charAt(0) ?? '?'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{row.original.user_name}</p>
            <p className="text-xs text-muted-foreground">{row.original.user_email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'total_checkins',
      header: t('tabs.users.columns.totalCheckins'),
    },
    {
      accessorKey: 'current_streak',
      header: t('tabs.users.columns.currentStreak'),
    },
    {
      accessorKey: 'longest_streak',
      header: t('tabs.users.columns.longestStreak'),
    },
    {
      accessorKey: 'last_checkin_date',
      header: t('tabs.users.columns.lastCheckin'),
      cell: ({ row }) =>
        row.original.last_checkin_date
          ? format(new Date(row.original.last_checkin_date), 'MMM d, yyyy')
          : '—',
    },
  ]

  const leaderboardColumns: ColumnDef<CheckinLeaderboardEntry>[] = [
    {
      id: 'rank',
      header: t('tabs.leaderboard.columns.rank'),
      cell: ({ row }) => <MedalIcon rank={row.index + 1} />,
    },
    {
      id: 'user',
      header: t('tabs.leaderboard.columns.user'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={row.original.user_avatar} alt={row.original.user_name} />
            <AvatarFallback>{row.original.user_name?.charAt(0) ?? '?'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{row.original.user_name}</p>
            <p className="text-xs text-muted-foreground">{row.original.user_email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'current_streak',
      header: t('tabs.leaderboard.columns.currentStreak'),
    },
    {
      accessorKey: 'total_checkins',
      header: t('tabs.leaderboard.columns.totalCheckins'),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('tabs.overview.label')}</TabsTrigger>
          <TabsTrigger value="users">{t('tabs.users.label')}</TabsTrigger>
          <TabsTrigger value="leaderboard">{t('tabs.leaderboard.label')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          {showBackendRequired ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">{t('backendRequired')}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard label={t('stats.totalToday')} value={stats?.total_today ?? '—'} />
                <StatCard label={t('stats.activeStreaks')} value={stats?.active_streaks ?? '—'} />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('tabs.overview.dailyChart')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {!dailyLoading && dailyStats && dailyStats.length > 0 ? (
                    <ChartContainer
                      config={{
                        count: {
                          label: t('tabs.overview.checkins'),
                          color: 'var(--color-chart-1)',
                        },
                      }}
                      className="h-[250px]"
                    >
                      <AreaChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="var(--color-count)"
                          fill="var(--color-count)"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      {t('emptyState')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 pt-4">
          <Input
            placeholder={t('tabs.users.search')}
            value={userSearch}
            onChange={(e) => {
              setUserSearch(e.target.value)
              setUserPage(1)
            }}
            className="max-w-sm"
          />
          <DataTable
            columns={userColumns}
            data={usersData?.data ?? []}
            isLoading={usersLoading}
            manualPagination
            pageIndex={userPage - 1}
            pageCount={usersData?.pagination?.page_size ?? 1}
            onPaginationChange={(p) => setUserPage(p + 1)}
            totalRows={usersData?.pagination?.total}
          />
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="pt-4">
          <DataTable columns={leaderboardColumns} data={leaderboard ?? []} isLoading={lbLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
