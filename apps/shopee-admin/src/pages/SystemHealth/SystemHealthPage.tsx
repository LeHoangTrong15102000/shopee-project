import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Activity,
  Database,
  Clock,
  RefreshCw,
  MemoryStick,
  Server,
  Layers,
  Timer,
  BarChart2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Badge } from 'src/components/ui/badge'
import { Progress } from 'src/components/ui/progress'
import { Switch } from 'src/components/ui/switch'
import { Label } from 'src/components/ui/label'
import { Skeleton } from 'src/components/ui/skeleton'
import { PageHeader } from 'src/components/shared/PageHeader'
import healthApi from 'src/apis/health.api'
import type { HealthHistoryPoint } from 'src/types/health.types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const AUTO_REFRESH_INTERVAL = 30_000

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function StatusIndicator({ status }: { status: 'healthy' | 'unhealthy' | 'degraded' | boolean }) {
  const isGood = status === 'healthy' || status === true
  const isDegraded = status === 'degraded'
  return (
    <span
      className={`inline-block size-2.5 rounded-full ${
        isGood ? 'bg-green-500' : isDegraded ? 'bg-yellow-500' : 'bg-red-500'
      }`}
      aria-hidden="true"
    />
  )
}

export default function SystemHealthPage() {
  const { t } = useTranslation('system-health')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [memoryHistory, setMemoryHistory] = useState<HealthHistoryPoint[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null)

  const {
    data: health,
    isLoading: loadingHealth,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => healthApi.getHealth().then((r) => r.data.data),
    refetchInterval: autoRefresh ? AUTO_REFRESH_INTERVAL : false,
  })

  const {
    data: metrics,
    isLoading: loadingMetrics,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: () => healthApi.getMetrics().then((r) => r.data.data),
    refetchInterval: autoRefresh ? AUTO_REFRESH_INTERVAL : false,
  })

  const {
    data: ready,
    isLoading: loadingReady,
    refetch: refetchReady,
  } = useQuery({
    queryKey: ['system-ready'],
    queryFn: () => healthApi.getReady().then((r) => r.data.data),
    refetchInterval: autoRefresh ? AUTO_REFRESH_INTERVAL : false,
  })

  const handleRefresh = useCallback(() => {
    refetchHealth()
    refetchMetrics()
    refetchReady()
    setLastUpdated(new Date())
  }, [refetchHealth, refetchMetrics, refetchReady])

  // Track memory history (last 10 data points)
  useEffect(() => {
    if (metrics?.memory) {
      setMemoryHistory((prev) => {
        const next = [
          ...prev,
          {
            timestamp: Date.now(),
            heapUsedMB: metrics.memory.heapUsedMB,
            heapTotalMB: metrics.memory.heapTotalMB,
          },
        ].slice(-10)
        return next
      })
      setLastUpdated(new Date())
    }
  }, [metrics])

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(handleRefresh, AUTO_REFRESH_INTERVAL)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, handleRefresh])

  const isLoading = loadingHealth || loadingMetrics || loadingReady
  const heapPercent = metrics?.memory
    ? Math.round((metrics.memory.heapUsedMB / metrics.memory.heapTotalMB) * 100)
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="auto-refresh" className="text-sm">
                {t('autoRefresh')}
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
        }
      />

      {lastUpdated && (
        <p className="text-xs text-muted-foreground">
          {t('lastUpdated')}: {format(lastUpdated, 'HH:mm:ss')}
        </p>
      )}

      {/* Status cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* API Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('cards.apiStatus')}
            </CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                <StatusIndicator status={health?.status ?? 'unhealthy'} />
                <span className="text-lg font-bold capitalize">
                  {health ? t(`status.${health.status}`) : t('status.unhealthy')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('cards.database')}
            </CardTitle>
            <Database className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="flex items-center gap-2">
                <StatusIndicator status={health?.database?.status ?? 'unhealthy'} />
                <span className="text-lg font-bold">
                  {health?.database?.status === 'healthy'
                    ? t('status.connected')
                    : t('status.disconnected')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('cards.redis')}
            </CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="flex items-center gap-2">
                <StatusIndicator status={ready?.checks?.redis ?? false} />
                <span className="text-lg font-bold">
                  {ready?.checks?.redis ? t('status.connected') : t('status.disconnected')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('cards.uptime')}
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <span className="text-lg font-bold">
                {health ? formatUptime(health.uptime) : '—'}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Memory usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MemoryStick className="size-4" />
              {t('memory.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : metrics ? (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('memory.usage')}</span>
                    <span className="font-medium">
                      {metrics.memory.heapUsedMB} / {metrics.memory.heapTotalMB} {t('memory.mb')} (
                      {heapPercent}%)
                    </span>
                  </div>
                  <Progress value={heapPercent} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('memory.heapUsed')}</p>
                    <p className="font-medium">
                      {metrics.memory.heapUsedMB} {t('memory.mb')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('memory.heapTotal')}</p>
                    <p className="font-medium">
                      {metrics.memory.heapTotalMB} {t('memory.mb')}
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Memory sparkline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('sparkline.memoryHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {memoryHistory.length < 2 ? (
              <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
                {isLoading ? <Skeleton className="h-full w-full" /> : 'Collecting data...'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={memoryHistory}>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) => format(new Date(v), 'HH:mm:ss')}
                    tick={{ fontSize: 10 }}
                    hide
                  />
                  <YAxis tick={{ fontSize: 10 }} width={35} />
                  <Tooltip
                    labelFormatter={(v) => format(new Date(v as number), 'HH:mm:ss')}
                    formatter={(v: number) => [`${v} MB`, t('sparkline.heapUsed')]}
                  />
                  <Line
                    type="monotone"
                    dataKey="heapUsedMB"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name={t('sparkline.heapUsed')}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Server metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="size-4" />
            {t('metrics.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : metrics ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>
                <p className="text-muted-foreground">{t('metrics.pid')}</p>
                <p className="font-medium">{metrics.process.pid}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('metrics.platform')}</p>
                <p className="font-medium capitalize">{metrics.process.platform}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('metrics.nodeVersion')}</p>
                <p className="font-medium">{metrics.process.nodeVersion}</p>
              </div>
              {metrics.database.pool && (
                <>
                  <div>
                    <p className="text-muted-foreground">{t('metrics.totalConnections')}</p>
                    <p className="font-medium">{metrics.database.pool.totalConnections ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('metrics.availableConnections')}</p>
                    <p className="font-medium">
                      {metrics.database.pool.availableConnections ?? '—'}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Response time + Request stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Response time card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="size-4" />
              {t('responseTime.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : metrics?.requests ? (
              <div className="space-y-1">
                <p className="text-3xl font-bold tabular-nums">
                  {metrics.requests.avgResponseTimeMs}
                  <span className="ml-1 text-base font-normal text-muted-foreground">ms</span>
                </p>
                <p className="text-xs text-muted-foreground">{t('responseTime.description')}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('responseTime.noData')}</p>
            )}
          </CardContent>
        </Card>

        {/* Request stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="size-4" />
              {t('requestStats.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : metrics?.requests ? (
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('requestStats.total')}</p>
                  <p className="font-bold text-lg tabular-nums">
                    {metrics.requests.total.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('requestStats.perMinute')}</p>
                  <p className="font-bold text-lg tabular-nums">{metrics.requests.perMinute}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    {t('requestStats.errorRate')}
                  </p>
                  <p
                    className={`font-bold text-lg tabular-nums ${metrics.requests.errorRate > 5 ? 'text-red-500' : ''}`}
                  >
                    {metrics.requests.errorRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('requestStats.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
