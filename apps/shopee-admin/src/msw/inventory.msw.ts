import { http, HttpResponse } from 'msw'
import { mockLowStockProducts, mockOutOfStockProducts } from './data/inventory.mock'
import { API_URL } from './msw-utils'

const inventoryHandlers = [
  http.get(`${API_URL}/admin/inventory/low-stock`, () => {
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        products: mockLowStockProducts,
        pagination: { page: 1, limit: 50, total: mockLowStockProducts.length, totalPages: 1 },
      },
    })
  }),

  http.get(`${API_URL}/admin/inventory/out-of-stock`, () => {
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        products: mockOutOfStockProducts,
        pagination: { page: 1, limit: 50, total: mockOutOfStockProducts.length, totalPages: 1 },
      },
    })
  }),

  http.put(`${API_URL}/admin/inventory/:productId/stock`, async ({ params, request }) => {
    const body = (await request.json()) as { quantity: number }
    return HttpResponse.json({
      message: 'Cập nhật tồn kho thành công',
      data: { ...mockLowStockProducts[0], _id: params.productId, quantity: body.quantity },
    })
  }),

  http.put(`${API_URL}/admin/inventory/bulk-stock`, async ({ request }) => {
    const body = (await request.json()) as {
      items: Array<{ product_id: string; quantity: number }>
    }
    return HttpResponse.json({
      message: 'Cập nhật hàng loạt thành công',
      data: { modifiedCount: body.items.length },
    })
  }),
]

export default inventoryHandlers
