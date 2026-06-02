import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import shopApi from 'src/apis/shop.api'
import { formatNumberToSocialStyle } from 'src/utils/utils'

interface ShopMetricsProps {
  rating: number
  shopId?: string
}

// Inline skeleton for a metric value
const ValueSkeleton = () => (
  <span className="inline-block h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
)

const ShopMetrics = ({ rating, shopId }: ShopMetricsProps) => {
  const { t } = useTranslation('product')

  const {
    data: shopData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => shopApi.getShop(shopId!),
    enabled: Boolean(shopId),
    staleTime: 5 * 60 * 1000,
  })

  const shop = shopData?.data?.data

  const formatJoinedDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '—'
    try {
      return format(parseISO(dateStr), 'yyyy')
    } catch {
      return '—'
    }
  }

  const getMetricValue = (
    value: string | number | undefined,
    fallback: string = '—',
  ): string | number => {
    if (value === undefined || value === null) return fallback
    return value
  }

  const metrics = [
    {
      label: t('shop.ratings'),
      value: `${rating.toFixed(1)}/5.0`,
      loading: false,
    },
    {
      label: t('shop.responseRate'),
      value: shop ? `${shop.responseRate}%` : getMetricValue(undefined),
      loading: isLoading && Boolean(shopId),
    },
    {
      label: t('shop.products'),
      value: shop ? String(shop.productCount) : getMetricValue(undefined),
      loading: isLoading && Boolean(shopId),
    },
    {
      label: t('shop.responseTime'),
      value: shop
        ? shop.responseTime
        : isError || !shopId
          ? t('shop.withinHours')
          : getMetricValue(undefined),
      loading: isLoading && Boolean(shopId),
    },
    {
      label: t('shop.joined'),
      value: shop ? formatJoinedDate(shop.joinedDate) : getMetricValue(undefined),
      loading: isLoading && Boolean(shopId),
    },
    {
      label: t('shop.followers'),
      value: shop ? formatNumberToSocialStyle(shop.followerCount) : getMetricValue(undefined),
      loading: isLoading && Boolean(shopId),
    },
  ]

  return (
    <section className="grid grid-cols-2 gap-x-8 gap-y-3" aria-label={t('shop.statistics')}>
      {metrics.map((m, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">{m.label}:</span>
          {m.loading ? (
            <ValueSkeleton />
          ) : (
            <span className="font-medium text-orange dark:text-orange-400">{m.value}</span>
          )}
        </div>
      ))}
    </section>
  )
}

export default ShopMetrics
