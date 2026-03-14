import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
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
} from 'src/hooks/useAnalytics';
import { formatCurrency } from 'src/utils/format';
import type { ProductAnalytics } from 'src/types';

export default function AnalyticsPage() {
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
    { accessorKey: 'name', header: 'Product' },
    { accessorKey: 'sold', header: 'Sold' },
    { accessorKey: 'view', header: 'Views' },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => row.original.rating?.toFixed(1) ?? '—',
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
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
    { accessorKey: 'category_name', header: 'Category' },
    { accessorKey: 'product_count', header: 'Products' },
    { accessorKey: 'total_sold', header: 'Total Sold' },
    {
      accessorKey: 'average_price',
      header: 'Avg Price',
      cell: ({ row }) => formatCurrency(Math.round(row.original.average_price)),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Product and chatbot analytics"
        actions={<PeriodSelect value={period} onChange={setPeriod} />}
      />
      <Tabs defaultValue="top-selling">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap scroll-p-1">
          <TabsTrigger value="top-selling">Top Selling</TabsTrigger>
          <TabsTrigger value="top-viewed">Top Viewed</TabsTrigger>
          <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
          <TabsTrigger value="by-category">By Category</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
        </TabsList>
        <TabsContent value="top-selling">
          {sellingError && (
            <ErrorState message="Failed to load analytics" onRetry={refetchSelling} />
          )}
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Conversations" value={chatbot.total_conversations} />
              <StatCard label="Total Messages" value={chatbot.total_messages} />
              <StatCard
                label="Avg Messages/Conv"
                value={chatbot.avg_messages_per_conversation?.toFixed(1) ?? '0'}
              />
              <StatCard
                label="Satisfaction Rate"
                value={`${((chatbot.satisfaction_rate ?? 0) * 100).toFixed(0)}%`}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
