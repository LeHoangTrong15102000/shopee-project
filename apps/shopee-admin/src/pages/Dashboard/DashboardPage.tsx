import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'src/components/ui/chart';
import { StatCard } from 'src/components/shared/StatCard';
import { PeriodSelect } from 'src/components/shared/PeriodSelect';
import { PageHeader } from 'src/components/shared/PageHeader';
import { LoadingState } from 'src/components/shared/LoadingState';
import { ErrorState } from 'src/components/shared/ErrorState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table';
import {
  useDashboardOverview,
  useDashboardRevenue,
  useDashboardOrderTrend,
  useDashboardUserGrowth,
  useDashboardTopProducts,
  useDashboardTopBuyers,
  useDashboardRevenueByCategory,
} from 'src/hooks/useDashboard';
import { formatCurrency } from 'src/utils/format';
import { useIsMobile } from 'src/hooks/use-mobile';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const [period, setPeriod] = useState('30d');
  const [customRange, setCustomRange] = useState<
    { start_date: string; end_date: string } | undefined
  >();
  const isMobile = useIsMobile();

  const {
    data: overview,
    isLoading: loadingOverview,
    isError: overviewError,
    refetch: refetchOverview,
  } = useDashboardOverview();

  const { data: revenue } = useDashboardRevenue(period, customRange);
  const { data: orderTrend } = useDashboardOrderTrend(period);
  const { data: userGrowth } = useDashboardUserGrowth(period);
  const { data: topProducts } = useDashboardTopProducts(period);
  const { data: topBuyers } = useDashboardTopBuyers(period);
  const { data: revenueByCategory } = useDashboardRevenueByCategory(period);

  if (loadingOverview) return <LoadingState />;
  if (overviewError) return <ErrorState message={t('error')} onRetry={refetchOverview} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <PeriodSelect
            value={period}
            onChange={setPeriod}
            onCustomRange={(s, e) => setCustomRange({ start_date: s, end_date: e })}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('charts.revenue')}</CardTitle>
          </CardHeader>
          <CardContent aria-label={t('charts.revenue')}>
            <ChartContainer
              config={{ revenue: { label: t('charts.revenue'), color: 'var(--chart-1)' } }}
              className="h-[200px] md:h-[300px]"
            >
              <AreaChart data={revenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  fillOpacity={0.3}
                  stroke="var(--color-revenue)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Order Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('charts.orderTrend')}</CardTitle>
          </CardHeader>
          <CardContent aria-label={t('charts.orderTrend')}>
            <ChartContainer
              config={{ orders: { label: t('charts.orderTrend'), color: 'var(--chart-2)' } }}
              className="h-[200px] md:h-[300px]"
            >
              <LineChart data={orderTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--color-orders)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>{t('charts.userGrowth')}</CardTitle>
          </CardHeader>
          <CardContent aria-label={t('charts.userGrowth')}>
            <ChartContainer
              config={{ users: { label: t('charts.userGrowth'), color: 'var(--chart-3)' } }}
              className="h-[200px] md:h-[250px]"
            >
              <BarChart data={userGrowth ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="users" fill="var(--color-users)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue by Category Pie Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('charts.revenueByCategory')}</CardTitle>
          </CardHeader>
          <CardContent
            className="flex items-center justify-center"
            aria-label={t('charts.revenueByCategory')}
          >
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
              <PieChart>
                <Pie
                  data={revenueByCategory ?? []}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 60 : 90}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {(revenueByCategory ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tables.topProductsByRevenue')}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tables.product')}</TableHead>
                  <TableHead className="text-right">{t('tables.revenue')}</TableHead>
                  <TableHead className="text-right">{t('tables.sold')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(topProducts ?? []).map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                    <TableCell className="text-right">{p.sold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Buyers */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tables.topBuyers')}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tables.customer')}</TableHead>
                  <TableHead className="text-right">{t('tables.orders')}</TableHead>
                  <TableHead className="text-right">{t('tables.totalSpent')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(topBuyers ?? []).map((b) => (
                  <TableRow key={b._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{b.total_orders}</TableCell>
                    <TableCell className="text-right">{formatCurrency(b.total_spent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
