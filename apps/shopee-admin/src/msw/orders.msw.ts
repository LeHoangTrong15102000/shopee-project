import { http, HttpResponse } from 'msw'
import { mockOrders } from './data/orders.mock'
import { API_URL } from './msw-utils'

const ordersHandlers = [
  http.get(`${API_URL}/admin/orders`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '10')
    const status = url.searchParams.get('status')
    let filtered = mockOrders
    if (status) {
      filtered = filtered.filter((o) => o.status === status)
    }
    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)
    return HttpResponse.json({
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders: paginated,
        pagination: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit) || 1,
        },
      },
    })
  }),

  http.get(`${API_URL}/admin/orders/count-by-status`, () => {
    const counts = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => ({
      _id: s,
      count: mockOrders.filter((o) => o.status === s).length,
    }))
    return HttpResponse.json({ message: 'Thành công', data: counts })
  }),

  http.get(`${API_URL}/admin/orders/:id`, ({ params }) => {
    const order = mockOrders.find((o) => o._id === params.id)
    if (!order) {
      return HttpResponse.json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Thành công', data: order })
  }),

  http.put(`${API_URL}/admin/orders/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as { status: string }
    const order = mockOrders.find((o) => o._id === params.id)
    if (!order) {
      return HttpResponse.json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }
    return HttpResponse.json({
      message: 'Cập nhật trạng thái thành công',
      data: { ...order, status: body.status },
    })
  }),

  http.put(`${API_URL}/admin/orders/bulk-status`, async ({ request }) => {
    const body = (await request.json()) as { order_ids: string[]; status: string }
    return HttpResponse.json({
      message: 'Cập nhật hàng loạt thành công',
      data: { modifiedCount: body.order_ids.length },
    })
  }),
]

export default ordersHandlers
