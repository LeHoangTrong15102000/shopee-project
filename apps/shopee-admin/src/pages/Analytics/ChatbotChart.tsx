import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'src/components/ui/chart'
import { EmptyState } from 'src/components/shared/EmptyState'

interface ChatbotChartProps {
  data: Array<{ date: string; conversations: number; messages: number }> | undefined
  isLoading: boolean
}

export default function ChatbotChart({ data, isLoading }: ChatbotChartProps) {
  const { t } = useTranslation('analytics')

  if (isLoading) return null

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('chatbot.performanceOverTime')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title={t('charts.noData')}
            description={t('charts.noDataDescription')}
            className="h-[300px]"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('chatbot.performanceOverTime')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            conversations: {
              label: t('chatbot.conversations'),
              color: 'var(--color-chart-1)',
            },
            messages: { label: t('chatbot.messages'), color: 'var(--color-chart-2)' },
          }}
          className="h-[300px]"
          aria-label={t('chatbot.performanceOverTime')}
        >
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="conversations"
              stroke="var(--color-conversations)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="messages"
              stroke="var(--color-messages)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
