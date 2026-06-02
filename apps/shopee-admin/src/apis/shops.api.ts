import http from 'src/utils/http'
import type { SuccessResponse, PaginatedData, Product } from 'src/types'
import type {
  ShopAdmin,
  ShopDetail,
  UpdateShopStatusBody,
  ShopRevenueData,
} from 'src/types/shop.types'

interface ShopListParams {
  page?: number
  limit?: number
  status?: string
  search?: string
  sort_by?: string
  order?: 'asc' | 'desc'
}

interface ShopListResponse {
  data: ShopAdmin[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const shopsApi = {
  getAdminShops: (params?: ShopListParams) =>
    http.get<SuccessResponse<ShopListResponse>>('admin/shops', { params }),

  getAdminShopDetail: (id: string) => http.get<SuccessResponse<ShopDetail>>(`admin/shops/${id}`),

  updateShopStatus: (id: string, data: UpdateShopStatusBody) =>
    http.patch<SuccessResponse<ShopAdmin>>(`admin/shops/${id}/status`, data),

  getShopProducts: (id: string, params?: { page?: number; limit?: number }) =>
    http.get<SuccessResponse<PaginatedData<Product>>>(`admin/shops/${id}/products`, { params }),

  getShopRevenue: (id: string, period?: string) =>
    http.get<SuccessResponse<ShopRevenueData>>(`admin/shops/${id}/revenue`, {
      params: { period },
    }),
}

export default shopsApi
