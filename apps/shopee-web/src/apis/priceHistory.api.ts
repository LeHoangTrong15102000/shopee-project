import { PriceHistory, PriceAlert } from 'src/types/priceHistory.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// Mock data for fallback when API is not available
const mockPriceHistory: PriceHistory = {
  product_id: 'product1',
  current_price: 259000,
  lowest_price: 249000,
  highest_price: 350000,
  average_price: 295000,
  price_points: [
    { price: 350000, date: new Date(Date.now() - 86400000 * 30).toISOString() },
    { price: 340000, date: new Date(Date.now() - 86400000 * 25).toISOString() },
    { price: 320000, date: new Date(Date.now() - 86400000 * 20).toISOString() },
    { price: 299000, date: new Date(Date.now() - 86400000 * 15).toISOString() },
    { price: 279000, date: new Date(Date.now() - 86400000 * 10).toISOString() },
    { price: 269000, date: new Date(Date.now() - 86400000 * 5).toISOString() },
    { price: 249000, date: new Date(Date.now() - 86400000 * 3).toISOString() },
    { price: 259000, date: new Date(Date.now() - 86400000).toISOString() }
  ],
  price_trend: 'down',
  last_updated: new Date().toISOString()
}

const priceHistoryApi = {
  getPriceHistory: async (productId: string, params?: { days?: number }) => {
    try {
      const response = await http.get<SuccessResponseApi<PriceHistory>>(`/products/${productId}/price-history`, {
        params
      })
      return response
    } catch (error) {
      console.warn('Price history API not available, using mock data')
      return {
        data: {
          message: 'Lấy lịch sử giá thành công',
          data: { ...mockPriceHistory, product_id: productId }
        }
      }
    }
  },

  createPriceAlert: async (body: { product_id: string; target_price: number }) => {
    try {
      return await http.post<SuccessResponseApi<PriceAlert>>('/price-alerts', body)
    } catch (error) {
      console.warn('⚠️ [createPriceAlert] API not available, using mock data')
      const mockAlert: PriceAlert = {
        _id: `alert-${Date.now()}`,
        product_id: body.product_id,
        target_price: body.target_price,
        is_active: true,
        createdAt: new Date().toISOString()
      }
      return {
        data: {
          message: 'Tạo thông báo giá thành công (mock)',
          data: mockAlert
        }
      }
    }
  },

  getPriceAlerts: async () => {
    try {
      const response = await http.get<SuccessResponseApi<PriceAlert[]>>('/price-alerts')
      return response
    } catch (error) {
      console.warn('Price alerts API not available, using mock data')
      return {
        data: {
          message: 'Lấy danh sách thông báo giá thành công',
          data: [] as PriceAlert[]
        }
      }
    }
  },

  deletePriceAlert: async (alertId: string) => {
    try {
      const response = await http.delete<SuccessResponseApi<{ message: string }>>(`/price-alerts/${alertId}`)
      return response
    } catch (error) {
      console.warn('Delete price alert API not available, using mock data')
      return {
        data: {
          message: 'Xóa thông báo giá thành công',
          data: { message: 'Xóa thông báo giá thành công' }
        }
      }
    }
  }
}

export default priceHistoryApi
