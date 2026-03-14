import { useQuery } from '@tanstack/react-query';
import dashboardApi from 'src/apis/dashboard.api';

export const DASHBOARD_KEYS = {
  overview: ['dashboard-overview'] as const,
  revenue: (period: string) => ['dashboard-revenue', period] as const,
  orderTrend: (period: string) => ['dashboard-order-trend', period] as const,
  userGrowth: (period: string) => ['dashboard-user-growth', period] as const,
  topProducts: (period: string) => ['dashboard-top-products', period] as const,
  topBuyers: (period: string) => ['dashboard-top-buyers', period] as const,
  revenueByCategory: (period: string) => ['dashboard-revenue-category', period] as const,
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.overview,
    queryFn: () => dashboardApi.getOverview().then((r) => r.data.data),
  });
}

export function useDashboardRevenue(period: string) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.revenue(period),
    queryFn: () => dashboardApi.getRevenue({ period }).then((r) => r.data.data),
  });
}

export function useDashboardOrderTrend(period: string) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.orderTrend(period),
    queryFn: () => dashboardApi.getOrderTrend({ period }).then((r) => r.data.data),
  });
}

export function useDashboardUserGrowth(period: string) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.userGrowth(period),
    queryFn: () => dashboardApi.getUserGrowth({ period }).then((r) => r.data.data),
  });
}

export function useDashboardTopProducts(period: string) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.topProducts(period),
    queryFn: () => dashboardApi.getRevenueByProduct({ period, limit: 5 }).then((r) => r.data.data),
  });
}

export function useDashboardTopBuyers(period: string) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.topBuyers(period),
    queryFn: () => dashboardApi.getTopBuyers({ period, limit: 5 }).then((r) => r.data.data),
  });
}

export function useDashboardRevenueByCategory(period: string) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.revenueByCategory(period),
    queryFn: () => dashboardApi.getRevenueByCategory({ period }).then((r) => r.data.data),
  });
}
