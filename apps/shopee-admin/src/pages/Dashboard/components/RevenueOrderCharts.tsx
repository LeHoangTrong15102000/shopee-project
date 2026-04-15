import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'src/components/ui/chart'
import { EmptyState } from 'src/components/shared/EmptyState'

interface RevenueOrderChartsProps {
  revenue: Array<{ date: string; revenue: number }> | undefined
  orderTrend: Array<{ date: string; orders: number }> | undefined
}

export default function RevenueOrderCharts({ revenue, orderTrend }: RevenueOrderChartsProps) {
  const { t } = useTranslation('dashboard')

  const revenueChartConfig = {
    revenue: { label: t('charts.revenue'), color: 'var(--color-chart-1)' },
  }
  const orderChartConfig = {
    orders: { label: t('charts.orderTrend'), color: 'var(--color-chart-2)' },
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.revenue')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!revenue || revenue.length === 0 ? (
            <EmptyState
              title={t('charts.noData')}
              description={t('charts.noDataDescription')}
              className="h-[200px] md:h-[300px]"
            />
          ) : (
            <ChartContainer
              config={revenueChartConfig}
              className="h-[200px] md:h-[300px]"
              aria-label={t('charts.revenue')}
            >
              <AreaChart data={revenue}>
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('charts.orderTrend')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!orderTrend || orderTrend.length === 0 ? (
            <EmptyState
              title={t('charts.noData')}
              description={t('charts.noDataDescription')}
              className="h-[200px] md:h-[300px]"
            />
          ) : (
            <ChartContainer
              config={orderChartConfig}
              className="h-[200px] md:h-[300px]"
              aria-label={t('charts.orderTrend')}
            >
              <LineChart data={orderTrend}>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
