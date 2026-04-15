import http from 'src/utils/http'
import type {
  SuccessResponse,
  DashboardOverview,
  RevenueData,
  OrderTrendData,
  UserGrowthData,
  TopProduct,
  TopBuyer,
  RevenueByCategoryData,
} from 'src/types'

interface PeriodParams {
  period?: string
}

const dashboardApi = {
  getOverview: () => http.get<SuccessResponse<DashboardOverview>>('admin/dashboard/overview'),

  getRevenue: (params?: PeriodParams & { start_date?: string; end_date?: string }) =>
    http.get<SuccessResponse<RevenueData[]>>('admin/dashboard/revenue', { params }),

  getRevenueByCategory: (params?: PeriodParams) =>
    http.get<SuccessResponse<RevenueByCategoryData[]>>('admin/dashboard/revenue/by-category', {
      params,
    }),

  getRevenueByProduct: (params?: PeriodParams & { limit?: number }) =>
    http.get<SuccessResponse<TopProduct[]>>('admin/dashboard/revenue/by-product', { params }),

  getOrderTrend: (params?: PeriodParams) =>
    http.get<SuccessResponse<OrderTrendData[]>>('admin/dashboard/orders/trend', { params }),

  getUserGrowth: (params?: PeriodParams) =>
    http.get<SuccessResponse<UserGrowthData[]>>('admin/dashboard/users/growth', { params }),

  getTopBuyers: (params?: PeriodParams & { limit?: number }) =>
    http.get<SuccessResponse<TopBuyer[]>>('admin/dashboard/users/top-buyers', { params }),
}

export default dashboardApi
