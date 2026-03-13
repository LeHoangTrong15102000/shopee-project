import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import dashboardApi from 'src/apis/dashboard.api';
import { formatCurrency } from 'src/utils/format';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function DashboardPage() {
  const [period, setPeriod] = useState('30d');

  const {
    data: overview,
    isLoading: loadingOverview,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardApi.getOverview().then((r) => r.data.data),
  });

  const { data: revenue } = useQuery({
    queryKey: ['dashboard-revenue', period],
    queryFn: () => dashboardApi.getRevenue({ period }).then((r) => r.data.data),
  });

  const { data: orderTrend } = useQuery({
    queryKey: ['dashboard-order-trend', period],
    queryFn: () => dashboardApi.getOrderTrend({ period }).then((r) => r.data.data),
  });

  const { data: userGrowth } = useQuery({
    queryKey: ['dashboard-user-growth', period],
    queryFn: () => dashboardApi.getUserGrowth({ period }).then((r) => r.data.data),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['dashboard-top-products', period],
    queryFn: () => dashboardApi.getRevenueByProduct({ period, limit: 5 }).then((r) => r.data.data),
  });

  const { data: topBuyers } = useQuery({
    queryKey: ['dashboard-top-buyers', period],
    queryFn: () => dashboardApi.getTopBuyers({ period, limit: 5 }).then((r) => r.data.data),
  });

  const { data: revenueByCategory } = useQuery({
    queryKey: ['dashboard-revenue-category', period],
    queryFn: () => dashboardApi.getRevenueByCategory({ period }).then((r) => r.data.data),
  });

  if (loadingOverview) return <LoadingState />;
  if (overviewError)
    return <ErrorState message="Failed to load dashboard" onRetry={refetchOverview} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your store performance"
        actions={<PeriodSelect value={period} onChange={setPeriod} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={overview?.total_revenue ?? 0}
          trend={overview?.revenue_change}
          formatter={formatCurrency}
          icon={<DollarSign className="size-4" />}
        />
        <StatCard
          label="Total Orders"
          value={overview?.total_orders ?? 0}
          trend={overview?.orders_change}
          icon={<ShoppingCart className="size-4" />}
        />
        <StatCard
          label="Total Users"
          value={overview?.total_users ?? 0}
          trend={overview?.users_change}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Total Products"
          value={overview?.total_products ?? 0}
          trend={overview?.products_change}
          icon={<Package className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent aria-label="Revenue chart">
            <ChartContainer
              config={{ revenue: { label: 'Revenue', color: 'var(--chart-1)' } }}
              className="h-[300px]"
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
            <CardTitle>Order Trend</CardTitle>
          </CardHeader>
          <CardContent aria-label="Order trend chart">
            <ChartContainer
              config={{ orders: { label: 'Orders', color: 'var(--chart-2)' } }}
              className="h-[300px]"
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
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent aria-label="User growth chart">
            <ChartContainer
              config={{ users: { label: 'Users', color: 'var(--chart-3)' } }}
              className="h-[250px]"
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
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent
            className="flex items-center justify-center"
            aria-label="Revenue by category chart"
          >
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={revenueByCategory ?? []}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
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
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
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
            <CardTitle>Top Buyers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
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
