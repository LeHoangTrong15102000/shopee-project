import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { DataTable } from 'src/components/shared/DataTable';
import { PageHeader } from 'src/components/shared/PageHeader';
import { PeriodSelect } from 'src/components/shared/PeriodSelect';
import { StatCard } from 'src/components/shared/StatCard';
import { ErrorState } from 'src/components/shared/ErrorState';
import {
  useTopSelling,
  useTopViewed,
  useTopRated,
  useStatsByCategory,
  useChatbotOverview,
  useChatbotPerformance,
} from 'src/hooks/useAnalytics';
import { formatCurrency } from 'src/utils/format';
import type { ProductAnalytics } from 'src/types';

export default function AnalyticsPage() {
  const { t } = useTranslation('analytics');
  const [period, setPeriod] = useState('30d');

  const {
    data: topSelling,
    isLoading: loadingSelling,
    isError: sellingError,
    refetch: refetchSelling,
  } = useTopSelling(period);
  // Note: topViewed and topRated backend endpoints return all-time data (no period filter).
  // Period is excluded from their query keys to avoid unnecessary refetches.
  const { data: topViewed, isLoading: loadingViewed } = useTopViewed();
  const { data: topRated, isLoading: loadingRated } = useTopRated();
  const { data: byCategory, isLoading: loadingCategory } = useStatsByCategory();
  const { data: chatbot } = useChatbotOverview();
  const { data: chatbotPerf } = useChatbotPerformance(period);

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
  ];

  const categoryCols: ColumnDef<{
    _id: string;
    category_name: string;
    product_count: number;
    total_sold: number;
    average_price: number;
  }>[] = [
    { accessorKey: 'category_name', header: t('columns.category') },
    { accessorKey: 'product_count', header: t('columns.products') },
    { accessorKey: 'total_sold', header: t('columns.totalSold') },
    {
      accessorKey: 'average_price',
      header: t('columns.avgPrice'),
      cell: ({ row }) => formatCurrency(Math.round(row.original.average_price)),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={<PeriodSelect value={period} onChange={setPeriod} />}
      />
      <Tabs defaultValue="top-selling">
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
              {Array.isArray(chatbotPerf) && chatbotPerf.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('chatbot.performanceOverTime')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chatbotPerf}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="conversations"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="messages"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
