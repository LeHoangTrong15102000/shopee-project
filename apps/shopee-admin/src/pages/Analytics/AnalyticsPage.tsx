import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ColumnDef } from '@tanstack/react-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import { DataTable } from 'src/components/shared/DataTable'
import { PageHeader } from 'src/components/shared/PageHeader'
import { PeriodSelect } from 'src/components/shared/PeriodSelect'
import { StatCard } from 'src/components/shared/StatCard'
import { ErrorState } from 'src/components/shared/ErrorState'
import { ChartSkeleton } from 'src/pages/Dashboard/components/ChartSkeleton'
import {
  useTopSelling,
  useTopViewed,
  useTopRated,
  useStatsByCategory,
  useChatbotOverview,
  useChatbotPerformance,
} from 'src/hooks/useAnalytics'
import { formatCurrency } from 'src/utils/format'
import type { ProductAnalytics } from 'src/types'

const ChatbotChart = lazy(() => import('./ChatbotChart'))

export default function AnalyticsPage() {
  const { t } = useTranslation('analytics')
  const [period, setPeriod] = useState('30d')
  const [activeTab, setActiveTab] = useState('top-selling')

  const {
    data: topSelling,
    isLoading: loadingSelling,
    isError: sellingError,
    refetch: refetchSelling,
  } = useTopSelling(period, { enabled: activeTab === 'top-selling' })
  // Note: topViewed and topRated backend endpoints return all-time data (no period filter).
  // Period is excluded from their query keys to avoid unnecessary refetches.
  const { data: topViewed, isLoading: loadingViewed } = useTopViewed({
    enabled: activeTab === 'top-viewed',
  })
  const { data: topRated, isLoading: loadingRated } = useTopRated({
    enabled: activeTab === 'top-rated',
  })
  const { data: byCategory, isLoading: loadingCategory } = useStatsByCategory({
    enabled: activeTab === 'by-category',
  })
  const { data: chatbot, isLoading: loadingChatbot } = useChatbotOverview({ enabled: activeTab === 'chatbot' })
  const { data: chatbotPerf, isLoading: loadingChatbotPerf } = useChatbotPerformance(period, {
    enabled: activeTab === 'chatbot',
  })

  const productCols: ColumnDef<ProductAnalytics>[] = [
    {
      accessorKey: 'image',
      header: '',
      cell: ({ row }) => (
        <img
          src={row.original.image}
          alt={row.original.name}
          className="size-10 rounded object-cover"
        />
      ),
      enableSorting: false,
    },
    { accessorKey: 'name', header: t('columns.product') },
    { accessorKey: 'sold', header: t('columns.sold') },
    { accessorKey: 'view', header: t('columns.views') },
    {
      accessorKey: 'rating',
      header: t('columns.rating'),
      cell: ({ row }) => row.original.rating?.toFixed(1) ?? '—',
    },
    {
      accessorKey: 'revenue',
      header: t('columns.revenue'),
      cell: ({ row }) => (row.original.revenue ? formatCurrency(row.original.revenue) : '—'),
    },
  ]

  const categoryCols: ColumnDef<{
    _id: string
    category_name: string
    product_count: number
    total_sold: number
    average_price: number
  }>[] = [
    { accessorKey: 'category_name', header: t('columns.category') },
    { accessorKey: 'product_count', header: t('columns.products') },
    { accessorKey: 'total_sold', header: t('columns.totalSold') },
    {
      accessorKey: 'average_price',
      header: t('columns.avgPrice'),
      cell: ({ row }) => formatCurrency(Math.round(row.original.average_price)),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={<PeriodSelect value={period} onChange={setPeriod} />}
      />
      <Tabs defaultValue="top-selling" onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap scroll-p-1">
          <TabsTrigger value="top-selling">{t('tabs.topSelling')}</TabsTrigger>
          <TabsTrigger value="top-viewed">{t('tabs.topViewed')}</TabsTrigger>
          <TabsTrigger value="top-rated">{t('tabs.topRated')}</TabsTrigger>
          <TabsTrigger value="by-category">{t('tabs.byCategory')}</TabsTrigger>
          <TabsTrigger value="chatbot">{t('tabs.chatbot')}</TabsTrigger>
        </TabsList>
        <TabsContent value="top-selling">
          {sellingError && <ErrorState message={t('error')} onRetry={refetchSelling} />}
          <DataTable
            columns={productCols}
            data={topSelling ?? []}
            isLoading={loadingSelling}
            searchKey="name"
          />
        </TabsContent>
        <TabsContent value="top-viewed">
          <DataTable
            columns={productCols}
            data={topViewed ?? []}
            isLoading={loadingViewed}
            searchKey="name"
          />
        </TabsContent>
        <TabsContent value="top-rated">
          <DataTable
            columns={productCols}
            data={topRated ?? []}
            isLoading={loadingRated}
            searchKey="name"
          />
        </TabsContent>
        <TabsContent value="by-category">
          <DataTable
            columns={categoryCols}
            data={(byCategory ?? []) as any}
            isLoading={loadingCategory}
            searchKey="category_name"
          />
        </TabsContent>
        <TabsContent value="chatbot">
          {loadingChatbot && <ChartSkeleton columns={1} />}
          {chatbot && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label={t('chatbot.totalConversations')}
                  value={chatbot.total_conversations}
                />
                <StatCard label={t('chatbot.totalMessages')} value={chatbot.total_messages} />
                <StatCard
                  label={t('chatbot.avgMessagesPerConv')}
                  value={chatbot.avg_messages_per_conversation?.toFixed(1) ?? '0'}
                />
                <StatCard
                  label={t('chatbot.satisfactionRate')}
                  value={`${((chatbot.satisfaction_rate ?? 0) * 100).toFixed(0)}%`}
                />
              </div>
              <Suspense fallback={<ChartSkeleton columns={1} />}>
                <ChatbotChart data={chatbotPerf} isLoading={loadingChatbotPerf} />
              </Suspense>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
