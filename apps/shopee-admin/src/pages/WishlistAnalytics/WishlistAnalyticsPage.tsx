import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Heart, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'src/components/ui/chart'
import { StatCard } from 'src/components/shared/StatCard'
import { PageHeader } from 'src/components/shared/PageHeader'
import { ErrorState } from 'src/components/shared/ErrorState'
import { EmptyState } from 'src/components/shared/EmptyState'
import { StaggerList, StaggerItem } from 'src/components/shared/StaggerList'
import wishlistAnalyticsApi from 'src/apis/wishlist-analytics.api'
import type { WishlistPeriod } from 'src/types/wishlist-analytics.types'

const PERIODS: WishlistPeriod[] = ['7d', '30d', '90d', 'all']

export default function WishlistAnalyticsPage() {
  const { t } = useTranslation('wishlist-analytics')
  const [period, setPeriod] = useState<WishlistPeriod>('30d')

  const {
    data: topProducts,
    isError: topError,
    refetch: refetchTop,
  } = useQuery({
    queryKey: ['wishlist-analytics', 'top-products', period],
    queryFn: () => wishlistAnalyticsApi.getTopWishlistedProducts(period).then((r) => r.data.data),
  })

  const { data: conversion } = useQuery({
    queryKey: ['wishlist-analytics', 'conversion'],
    queryFn: () => wishlistAnalyticsApi.getWishlistConversion().then((r) => r.data.data),
  })

  const { data: trends } = useQuery({
    queryKey: ['wishlist-analytics', 'trends', period],
    queryFn: () => wishlistAnalyticsApi.getWishlistTrends(period).then((r) => r.data.data),
  })

  if (topError) return <ErrorState message={t('error')} onRetry={refetchTop} />

  // Derived stats
  const totalWishlisted = topProducts?.total ?? 0
  const uniqueProducts = topProducts?.products.length ?? 0
  const avgConversion =
    conversion && conversion.items.length > 0
      ? conversion.items.reduce((sum, i) => sum + i.conversion_rate, 0) / conversion.items.length
      : 0

  // Low-stock alert: >10 wishlists, <5 stock (quantity)
  const lowStockAlerts =
    topProducts?.products.filter((p) => p.wishlist_count > 10 && p.quantity < 5) ?? []

  const trendsChartConfig = {
    count: { label: t('trends.additions'), color: 'var(--color-chart-2)' },
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex gap-1 rounded-lg border p-1">
            {PERIODS.map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className="h-7 px-3 text-xs"
              >
                {t(`period.${p}`)}
              </Button>
            ))}
          </div>
        }
      />

      {/* Stats row */}
      <StaggerList className="grid gap-4 sm:grid-cols-3" staggerDelay={0.075}>
        <StaggerItem>
          <StatCard
            label={t('stats.totalWishlisted')}
            value={totalWishlisted.toLocaleString()}
            icon={<Heart className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label={t('stats.uniqueProducts')}
            value={uniqueProducts}
            icon={<ShoppingBag className="size-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label={t('stats.avgConversion')}
            value={`${avgConversion.toFixed(1)}%`}
            icon={<TrendingUp className="size-4" />}
          />
        </StaggerItem>
      </StaggerList>

      {/* Low-stock alert */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
              <CardTitle className="text-sm text-amber-800 dark:text-amber-400">
                {t('alerts.lowStockTitle')}
              </CardTitle>
            </div>
            <CardDescription className="text-amber-700/80 dark:text-amber-500/80">
              {t('alerts.lowStockDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {lowStockAlerts.map((p) => (
                <div
                  key={p.product_id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                >
                  <span className="font-medium truncate">{p.name}</span>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-muted-foreground text-xs">
                      {t('alerts.wishlists', { count: p.wishlist_count })}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {t('alerts.stock', { count: p.quantity })}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('trends.title')}</CardTitle>
          <CardDescription>{t('trends.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!trends || trends.trends.length === 0 ? (
            <EmptyState />
          ) : (
            <ChartContainer config={trendsChartConfig} className="h-[240px] w-full">
              <AreaChart data={trends.trends} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="wishlistGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-chart-2)"
                  fill="url(#wishlistGradient)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top wishlisted products */}
        <Card>
          <CardHeader>
            <CardTitle>{t('topProducts.title')}</CardTitle>
            <CardDescription>{t('topProducts.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!topProducts || topProducts.products.length === 0 ? (
              <EmptyState description={t('topProducts.noData')} />
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-[2rem_1fr_5rem_4rem] gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                  <span>{t('topProducts.rank')}</span>
                  <span>{t('topProducts.product')}</span>
                  <span className="text-right">{t('topProducts.wishlists')}</span>
                  <span className="text-right">{t('topProducts.stock')}</span>
                </div>
                {topProducts.products.slice(0, 15).map((item, idx) => (
                  <div
                    key={item.product_id}
                    className="grid grid-cols-[2rem_1fr_5rem_4rem] gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <span className="text-muted-foreground font-mono text-xs">{idx + 1}</span>
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="text-right tabular-nums">{item.wishlist_count.toLocaleString()}</span>
                    <span className="text-right tabular-nums">
                      {item.quantity < 5 ? (
                        <span className="text-red-600 dark:text-red-400">{item.quantity}</span>
                      ) : (
                        item.quantity
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion insights */}
        <Card>
          <CardHeader>
            <CardTitle>{t('conversion.title')}</CardTitle>
            <CardDescription>{t('conversion.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!conversion || conversion.items.length === 0 ? (
              <EmptyState description={t('conversion.noData')} />
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_4rem_4rem_5rem] gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                  <span>{t('conversion.product')}</span>
                  <span className="text-right">{t('conversion.wishlists')}</span>
                  <span className="text-right">{t('conversion.purchases')}</span>
                  <span className="text-right">{t('conversion.rate')}</span>
                </div>
                {conversion.items.slice(0, 15).map((item) => (
                  <div
                    key={item.product_id}
                    className="grid grid-cols-[1fr_4rem_4rem_5rem] gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="text-right tabular-nums text-muted-foreground">
                      {item.wishlist_count}
                    </span>
                    <span className="text-right tabular-nums text-muted-foreground">
                      {item.purchase_count}
                    </span>
                    <span className="text-right tabular-nums font-medium">
                      {item.conversion_rate.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
