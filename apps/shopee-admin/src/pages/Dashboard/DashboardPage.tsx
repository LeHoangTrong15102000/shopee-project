import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, ShoppingCart, Users, Package, Clock, AlertCircle, Zap, MessageSquare } from 'lucide-react'
import { StatCard } from 'src/components/shared/StatCard'
import { PeriodSelect } from 'src/components/shared/PeriodSelect'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import { StaggerList, StaggerItem } from 'src/components/shared/StaggerList'
import { Skeleton } from 'src/components/ui/skeleton'
import { Card, CardContent, CardHeader } from 'src/components/ui/card'
import { Badge } from 'src/components/ui/badge'
import {
  useDashboardOverview,
  useDashboardRevenue,
  useDashboardOrderTrend,
  useDashboardUserGrowth,
  useDashboardTopProducts,
  useDashboardTopBuyers,
  useDashboardRevenueByCategory,
} from 'src/hooks/useDashboard'
import { useRealtimeMetrics } from 'src/hooks/useRealtimeMetrics'
import { formatPrice } from '@shopee/shared-utils'
import { ChartSkeleton } from './components/ChartSkeleton'

const RevenueOrderCharts = lazy(() => import('./components/RevenueOrderCharts'))
const UserCategoryCharts = lazy(() => import('./components/UserCategoryCharts'))
const TopProductsBuyers = lazy(() => import('./components/TopProductsBuyers'))

export default function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const [period, setPeriod] = useState('30d')
  const [customRange, setCustomRange] = useState<
    { start_date: string; end_date: string } | undefined
  >()

  const {
    data: overview,
    isLoading: loadingOverview,
    isError: overviewError,
    refetch: refetchOverview,
  } = useDashboardOverview()

  const { data: revenue } = useDashboardRevenue(period, customRange)
  const { data: orderTrend } = useDashboardOrderTrend(period)
  const { data: userGrowth } = useDashboardUserGrowth(period)
  const { data: topProducts } = useDashboardTopProducts(period)
  const { data: topBuyers } = useDashboardTopBuyers(period)
  const { data: revenueByCategory } = useDashboardRevenueByCategory(period)

  const realtimeMetrics = useRealtimeMetrics()

  const handleCustomRange = (s: string, e: string) => setCustomRange({ start_date: s, end_date: e })

  if (overviewError) return <ErrorState message={t('error')} onRetry={refetchOverview} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <PeriodSelect value={period} onChange={setPeriod} onCustomRange={handleCustomRange} />
        }
      />

      {loadingOverview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20" />
                <Skeleton className="mt-2 h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StaggerList
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          staggerDelay={0.075}
        >
            <StaggerItem>
              <StatCard
                label={t('stats.totalRevenue')}
                value={overview?.total_revenue ?? 0}
                trend={overview?.revenue_change}
                formatter={formatPrice}
                icon={<DollarSign className="size-4" />}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label={t('stats.totalOrders')}
                value={overview?.total_orders ?? 0}
                trend={overview?.orders_change}
                icon={<ShoppingCart className="size-4" />}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label={t('stats.totalUsers')}
                value={overview?.total_users ?? 0}
                trend={overview?.users_change}
                icon={<Users className="size-4" />}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label={t('stats.totalProducts')}
                value={overview?.total_products ?? 0}
                trend={overview?.products_change}
                icon={<Package className="size-4" />}
              />
            </StaggerItem>
          </StaggerList>
      )}

      {realtimeMetrics && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{t('realtime.title')}</span>
            <Badge variant="outline" className="gap-1 border-green-500 text-green-600 text-xs px-1.5 py-0">
              <span className="size-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              {t('realtime.live')}
            </Badge>
          </div>
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.05}>
            <StaggerItem>
              <StatCard
                label={t('realtime.todayRevenue')}
                value={realtimeMetrics.today_revenue}
                formatter={formatPrice}
                icon={<DollarSign className="size-4" />}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label={t('realtime.todayOrders')}
                value={realtimeMetrics.today_orders}
                icon={<ShoppingCart className="size-4" />}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label={t('realtime.pendingOrders')}
                value={realtimeMetrics.pending_orders}
                icon={<Clock className="size-4" />}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label={t('realtime.activeUsers')}
                value={realtimeMetrics.active_users}
                icon={<Users className="size-4" />}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label={t('realtime.ordersPerHour')}
                value={realtimeMetrics.orders_per_hour}
                icon={<Zap className="size-4" />}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label={t('realtime.pendingQA')}
                value={realtimeMetrics.pending_qa}
                icon={<MessageSquare className="size-4" />}
              />
            </StaggerItem>
          </StaggerList>
        </div>
      )}

      <Suspense fallback={<ChartSkeleton columns={2} />}>
        <RevenueOrderCharts revenue={revenue} orderTrend={orderTrend} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton columns={3} />}>
        <UserCategoryCharts userGrowth={userGrowth} revenueByCategory={revenueByCategory} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton columns={2} />}>
        <TopProductsBuyers topProducts={topProducts} topBuyers={topBuyers} />
      </Suspense>
    </div>
  )
}
