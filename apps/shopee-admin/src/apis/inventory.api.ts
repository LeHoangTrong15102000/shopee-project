import http from 'src/utils/http'
import type { SuccessResponse, Product } from 'src/types'

interface StockListParams {
  page?: number
  limit?: number
  threshold?: number
}

interface StockListResponse {
  products: Product[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const inventoryApi = {
  getLowStock: (params?: StockListParams) =>
    http.get<SuccessResponse<StockListResponse>>('admin/inventory/low-stock', { params }),

  getOutOfStock: (params?: StockListParams) =>
    http.get<SuccessResponse<StockListResponse>>('admin/inventory/out-of-stock', { params }),

  updateStock: (productId: string, body: { quantity: number }) =>
    http.put<SuccessResponse<Product>>(`admin/inventory/${productId}/stock`, body),

  bulkUpdateStock: (body: { items: Array<{ product_id: string; quantity: number }> }) =>
    http.put<SuccessResponse<{ modifiedCount: number }>>('admin/inventory/bulk-stock', body),
}

export default inventoryApi
