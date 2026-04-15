import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'src/components/ui/chart'
import { formatCurrency } from 'src/utils/format'
import { useIsMobile } from 'src/hooks/use-mobile'
import { EmptyState } from 'src/components/shared/EmptyState'

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

interface UserCategoryChartsProps {
  userGrowth: Array<{ date: string; users: number }> | undefined
  revenueByCategory: Array<{ category: string; revenue: number; percent: number }> | undefined
}

export default function UserCategoryCharts({
  userGrowth,
  revenueByCategory,
}: UserCategoryChartsProps) {
  const { t } = useTranslation('dashboard')
  const isMobile = useIsMobile()

  const userChartConfig = {
    users: { label: t('charts.userGrowth'), color: 'var(--color-chart-3)' },
  }

  const categoryChartConfig = (revenueByCategory ?? []).reduce(
    (acc, item, i) => {
      acc[item.category] = { label: item.category, color: COLORS[i % COLORS.length] }
      return acc
    },
    {} as Record<string, { label: string; color: string }>,
  )

  const pieLabel = ({ category, percent }: { category: string; percent: number }) =>
    `${category} ${(percent * 100).toFixed(0)}%`

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.userGrowth')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!userGrowth || userGrowth.length === 0 ? (
            <EmptyState
              title={t('charts.noData')}
              description={t('charts.noDataDescription')}
              className="h-[200px] md:h-[250px]"
            />
          ) : (
            <ChartContainer
              config={userChartConfig}
              className="h-[200px] md:h-[250px]"
              aria-label={t('charts.userGrowth')}
            >
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="users" fill="var(--color-users)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('charts.revenueByCategory')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          {!revenueByCategory || revenueByCategory.length === 0 ? (
            <EmptyState
              title={t('charts.noData')}
              description={t('charts.noDataDescription')}
              className={isMobile ? 'h-[200px]' : 'h-[250px]'}
            />
          ) : (
            <ChartContainer
              config={categoryChartConfig}
              className={isMobile ? 'h-[200px]' : 'h-[250px]'}
              aria-label={t('charts.revenueByCategory')}
            >
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 60 : 90}
                  label={pieLabel}
                >
                  {revenueByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(v) => formatCurrency(v as number)} />}
                />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
