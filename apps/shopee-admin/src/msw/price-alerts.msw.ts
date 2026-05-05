import { http, HttpResponse } from 'msw'
import { API_URL } from './msw-utils'

const mockPriceAlerts = [
  {
    _id: 'alert-1',
    user: { _id: 'user-1', name: 'Nguyen Van A', email: 'a@example.com' },
    product: { _id: 'prod-1', name: 'iPhone 15' },
    target_price: 20000000,
    current_price: 22000000,
    is_triggered: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'alert-2',
    user: { _id: 'user-2', name: 'Tran Thi B', email: 'b@example.com' },
    product: { _id: 'prod-2', name: 'Samsung Galaxy S24' },
    target_price: 18000000,
    current_price: 17500000,
    is_triggered: true,
    createdAt: '2024-01-02T00:00:00.000Z',
  },
]

const priceAlertsHandlers = [
  http.get(`${API_URL}/admin/price-alerts`, () => {
    return HttpResponse.json({
      message: 'Success',
      data: {
        alerts: mockPriceAlerts,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      },
    })
  }),
]

export default priceAlertsHandlers
