import React, { useMemo } from 'react'
import { View, Dimensions, ActivityIndicator } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'
import { AppText } from '@/components/ui'
import { usePriceHistory } from '@/hooks/usePriceAlerts'

interface PriceHistoryChartProps {
  productId: string
}

const screenWidth = Dimensions.get('window').width

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`
  return String(price)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function PriceHistoryChart({ productId }: PriceHistoryChartProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const { data: history, isLoading, isError } = usePriceHistory(productId)

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null

    // Limit to 30 points max, evenly spaced
    const step = Math.max(1, Math.floor(history.length / 30))
    const sampled = history.filter((_, i) => i % step === 0).slice(0, 30)

    const prices = sampled.map((p) => p.price)
    const labels = sampled.map((p) => formatDate(p.date))

    // Show only every Nth label to avoid crowding
    const labelStep = Math.max(1, Math.floor(labels.length / 6))
    const sparseLabels = labels.map((l, i) => (i % labelStep === 0 ? l : ''))

    const highest = Math.max(...prices)
    const lowest = Math.min(...prices)
    const average = prices.reduce((a, b) => a + b, 0) / prices.length

    return { prices, sparseLabels, highest, lowest, average }
  }, [history])

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  if (isError || !chartData) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <AppText raw variant="bodySmall" color="muted">
          {t('priceHistory.noData')}
        </AppText>
      </View>
    )
  }

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      `rgba(${colors.primary === '#ee4d2d' ? '238,77,45' : '238,77,45'}, ${opacity})`,
    labelColor: () => colors.foreground,
    style: { borderRadius: 8 },
    propsForDots: { r: '3', strokeWidth: '1', stroke: colors.primary },
    propsForBackgroundLines: { stroke: colors.neutrals800 },
  }

  return (
    <View style={{ paddingVertical: 16 }}>
      <AppText
        raw
        variant="body"
        weight="semibold"
        style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        {t('priceHistory.title')}
      </AppText>

      <LineChart
        data={{
          labels: chartData.sparseLabels,
          datasets: [{ data: chartData.prices }],
        }}
        width={screenWidth - 16}
        height={180}
        chartConfig={chartConfig}
        bezier
        withDots={false}
        withShadow={false}
        withInnerLines={false}
        style={{ marginLeft: 8, borderRadius: 8 }}
        yAxisLabel=""
        yAxisSuffix=""
        formatYLabel={(val) => formatPrice(Number(val))}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingHorizontal: 16,
          marginTop: 8,
        }}>
        <View style={{ alignItems: 'center' }}>
          <AppText raw variant="labelSmall" color="muted">
            {t('priceHistory.high')}
          </AppText>
          <AppText raw variant="bodySmall" weight="semibold" style={{ color: colors.error }}>
            {formatPrice(chartData.highest)}
          </AppText>
        </View>
        <View style={{ alignItems: 'center' }}>
          <AppText raw variant="labelSmall" color="muted">
            {t('priceHistory.avg')}
          </AppText>
          <AppText raw variant="bodySmall" weight="semibold">
            {formatPrice(Math.round(chartData.average))}
          </AppText>
        </View>
        <View style={{ alignItems: 'center' }}>
          <AppText raw variant="labelSmall" color="muted">
            {t('priceHistory.low')}
          </AppText>
          <AppText raw variant="bodySmall" weight="semibold" style={{ color: colors.success }}>
            {formatPrice(chartData.lowest)}
          </AppText>
        </View>
      </View>
    </View>
  )
}
