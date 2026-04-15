import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react'
import { StatCard } from 'src/components/shared/StatCard'
import { PeriodSelect } from 'src/components/shared/PeriodSelect'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import { Skeleton } from 'src/components/ui/skeleton'
import { Card, CardContent, CardHeader } from 'src/components/ui/card'
import {
  useDashboardOverview,
  useDashboardRevenue,
  useDashboardOrderTrend,
  useDashboardUserGrowth,
  useDashboardTopProducts,
  useDashboardTopBuyers,
  useDashboardRevenueByCategory,
} from 'src/hooks/useDashboard'
import { formatCurrency } from 'src/utils/format'
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingOverview ? (
          Array.from({ length: 4 }).map((_, i) => (
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
          ))
        ) : (
          <>
            <StatCard
              label={t('stats.totalRevenue')}
              value={overview?.total_revenue ?? 0}
              trend={overview?.revenue_change}
              formatter={formatCurrency}
              icon={<DollarSign className="size-4" />}
            />
            <StatCard
              label={t('stats.totalOrders')}
              value={overview?.total_orders ?? 0}
              trend={overview?.orders_change}
              icon={<ShoppingCart className="size-4" />}
            />
            <StatCard
              label={t('stats.totalUsers')}
              value={overview?.total_users ?? 0}
              trend={overview?.users_change}
              icon={<Users className="size-4" />}
            />
            <StatCard
              label={t('stats.totalProducts')}
              value={overview?.total_products ?? 0}
              trend={overview?.products_change}
              icon={<Package className="size-4" />}
            />
          </>
        )}
      </div>

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
