import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'src/components/ui/chart';
import { formatCurrency } from 'src/utils/format';
import { useIsMobile } from 'src/hooks/use-mobile';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface UserCategoryChartsProps {
  userGrowth: Array<{ date: string; users: number }> | undefined;
  revenueByCategory: Array<{ category: string; revenue: number; percent: number }> | undefined;
}

export default function UserCategoryCharts({
  userGrowth,
  revenueByCategory,
}: UserCategoryChartsProps) {
  const { t } = useTranslation('dashboard');
  const isMobile = useIsMobile();

  const userChartConfig = { users: { label: t('charts.userGrowth'), color: 'var(--chart-3)' } };

  const pieLabel = ({ category, percent }: { category: string; percent: number }) =>
    `${category} ${(percent * 100).toFixed(0)}%`;

  const tooltipFormatter = (v: number) => formatCurrency(v);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.userGrowth')}</CardTitle>
        </CardHeader>
        <CardContent aria-label={t('charts.userGrowth')}>
          <ChartContainer config={userChartConfig} className="h-[200px] md:h-[250px]">
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
                label={pieLabel}
              >
                {(revenueByCategory ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
