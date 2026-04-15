import { useTranslation } from 'react-i18next'

interface ShopMetricsProps {
  rating: number
}

const ShopMetrics = ({ rating }: ShopMetricsProps) => {
  const { t } = useTranslation('product')

  // TODO: Replace hardcoded metrics with real shop API data when available
  const metrics = [
    { label: t('shop.ratings'), value: `${rating.toFixed(1)}/5.0` },
    { label: t('shop.responseRate'), value: '95%' },
    { label: t('shop.products'), value: '128' },
    { label: t('shop.responseTime'), value: t('shop.withinHours') },
    { label: t('shop.joined'), value: t('shop.joinedYears', { count: 3 }) },
    { label: t('shop.followers'), value: '12.5k' },
  ]

  return (
    <section className="grid grid-cols-2 gap-x-8 gap-y-3" aria-label={t('shop.statistics')}>
      {metrics.map((m, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">{m.label}:</span>
          <span className="font-medium text-orange dark:text-orange-400">{m.value}</span>
        </div>
      ))}
    </section>
  )
}

export default ShopMetrics
