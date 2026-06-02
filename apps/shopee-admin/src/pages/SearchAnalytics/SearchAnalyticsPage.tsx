import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Minus, Search, BarChart2, AlertCircle, Hash } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'src/components/ui/chart'
import { StatCard } from 'src/components/shared/StatCard'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import { EmptyState } from 'src/components/shared/EmptyState'
import { StaggerList, StaggerItem } from 'src/components/shared/StaggerList'
import { useNavigate } from 'react-router-dom'
import searchAnalyticsApi from 'src/apis/search-analytics.api'
import type { SearchPeriod } from 'src/types/search-analytics.types'

const PERIODS: SearchPeriod[] = ['7d', '30d', '90d']

export default function SearchAnalyticsPage() {
  const { t } = useTranslation('search-analytics')
  const navigate = useNavigate()
  const [period, setPeriod] = useState<SearchPeriod>('30d')

  const {
    data: overview,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['search-analytics', 'overview', period],
    queryFn: () => searchAnalyticsApi.getOverview(period).then((r) => r.data.data),
  })

  const { data: volume } = useQuery({
    queryKey: ['search-analytics', 'volume', period],
    queryFn: () => searchAnalyticsApi.getSearchVolume(period).then((r) => r.data.data),
  })

  const { data: popular } = useQuery({
    queryKey: ['search-analytics', 'popular', period],
    queryFn: () => searchAnalyticsApi.getPopularSearches(period).then((r) => r.data.data),
  })

  const { data: trending } = useQuery({
    queryKey: ['search-analytics', 'trending', period],
    queryFn: () => searchAnalyticsApi.getTrendingSearches(period).then((r) => r.data.data),
  })

  const { data: zeroResults } = useQuery({
    queryKey: ['search-analytics', 'zero-results', period],
    queryFn: () => searchAnalyticsApi.getZeroResultSearches(period).then((r) => r.data.data),
  })

  if (overviewError) return <ErrorState message={t('error')} onRetry={refetchOverview} />

  const volumeChartConfig = {
    searches: { label: t('volume.searches'), color: 'var(--color-chart-1)' },
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex gap-1 rounded-lg border p-1">
            {PERIODS.map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className="h-7 px-3 text-xs"
              >
                {t(`period.${p}`)}
              </Button>
            ))}
          </div>
        }
      />

      {/* Stats row */}
      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.075}>
        <StaggerItem>
          <StatCard
            label={t('stats.totalSearches')}
            value={overview?.total_searches ?? 0}
            icon={<Search className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label={t('stats.uniqueKeywords')}
            value={overview?.unique_keywords ?? 0}
            icon={<Hash className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label={t('stats.avgPerDay')}
            value={overview?.avg_per_day ?? 0}
            icon={<BarChart2 className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label={t('stats.zeroResultRate')}
            value={overview ? `${overview.zero_result_rate.toFixed(1)}%` : '—'}
            icon={<AlertCircle className="size-4" />}
          />
        </StaggerItem>
      </StaggerList>

      {/* Search volume chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('volume.title')}</CardTitle>
          <CardDescription>{t('volume.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!volume || volume.length === 0 ? (
            <EmptyState />
          ) : (
            <ChartContainer config={volumeChartConfig} className="h-[240px] w-full">
              <AreaChart data={volume} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="searchGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="searches"
                  stroke="var(--color-chart-1)"
                  fill="url(#searchGradient)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Popular searches table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('popular.title')}</CardTitle>
            <CardDescription>{t('popular.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!popular || popular.length === 0 ? (
              <EmptyState description={t('popular.noData')} />
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-[2rem_1fr_5rem_3rem] gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                  <span>{t('popular.rank')}</span>
                  <span>{t('popular.keyword')}</span>
                  <span className="text-right">{t('popular.count')}</span>
                  <span className="text-right">{t('popular.trend')}</span>
                </div>
                {popular.map((item, idx) => (
                  <div
                    key={item.keyword}
                    className="grid grid-cols-[2rem_1fr_5rem_3rem] gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <span className="text-muted-foreground font-mono text-xs">{idx + 1}</span>
                    <span className="truncate font-medium">{item.keyword}</span>
                    <span className="text-right tabular-nums">{item.count.toLocaleString()}</span>
                    <span className="flex justify-end">
                      {item.trend === 'up' ? (
                        <TrendingUp className="size-3.5 text-green-500" />
                      ) : item.trend === 'down' ? (
                        <TrendingDown className="size-3.5 text-red-500" />
                      ) : (
                        <Minus className="size-3.5 text-muted-foreground" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trending searches */}
        <Card>
          <CardHeader>
            <CardTitle>{t('trending.title')}</CardTitle>
            <CardDescription>{t('trending.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!trending || trending.length === 0 ? (
              <EmptyState description={t('trending.noData')} />
            ) : (
              <div className="space-y-2">
                {trending.map((item) => (
                  <div
                    key={item.keyword}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <TrendingUp className="size-3.5 shrink-0 text-green-500" />
                      <span className="truncate text-sm font-medium">{item.keyword}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-green-600 border-green-500 text-xs"
                    >
                      +{item.increase_percent.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Zero-result searches */}
      <Card>
        <CardHeader>
          <CardTitle>{t('zeroResults.title')}</CardTitle>
          <CardDescription>{t('zeroResults.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!zeroResults || zeroResults.length === 0 ? (
            <EmptyState description={t('zeroResults.noData')} />
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_5rem_8rem] gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                <span>{t('zeroResults.keyword')}</span>
                <span className="text-right">{t('zeroResults.count')}</span>
                <span className="text-right">{t('zeroResults.action')}</span>
              </div>
              {zeroResults.map((item) => (
                <div
                  key={item.keyword}
                  className="grid grid-cols-[1fr_5rem_8rem] gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                >
                  <span className="truncate font-medium">{item.keyword}</span>
                  <span className="text-right tabular-nums text-muted-foreground">
                    {item.count.toLocaleString()}
                  </span>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-primary"
                      onClick={() =>
                        navigate(`/products/new?name=${encodeURIComponent(item.keyword)}`)
                      }
                    >
                      {t('zeroResults.createProduct')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
