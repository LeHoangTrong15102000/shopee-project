import { http, HttpResponse } from 'msw'
import { mockVouchers } from './data/vouchers.mock'
import { API_URL } from './msw-utils'

const vouchersHandlers = [
  http.get(`${API_URL}/admin/vouchers`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '10')
    const start = (page - 1) * limit
    const paginated = mockVouchers.slice(start, start + limit)
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        vouchers: paginated,
        pagination: {
          page,
          limit,
          total: mockVouchers.length,
          totalPages: Math.ceil(mockVouchers.length / limit) || 1,
        },
      },
    })
  }),

  http.get(`${API_URL}/admin/vouchers/stats`, () => {
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        total: mockVouchers.length,
        active: mockVouchers.filter((v) => v.is_active).length,
        inactive: mockVouchers.filter((v) => !v.is_active).length,
        total_usage: mockVouchers.reduce((sum, v) => sum + v.used_count, 0),
      },
    })
  }),

  http.get(`${API_URL}/admin/vouchers/:id/usage`, ({ params }) => {
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        usage: [
          {
            _id: 'usage-1',
            user: 'user-1',
            voucher: params.id,
            order: 'order-1',
            discount_amount: 50000,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: { page: 1, limit: 10, total: 1 },
      },
    })
  }),

  http.get(`${API_URL}/admin/vouchers/:id`, ({ params }) => {
    const voucher = mockVouchers.find((v) => v._id === params.id)
    if (!voucher) {
      return HttpResponse.json({ message: 'Không tìm thấy voucher' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Thành công', data: voucher })
  }),

  http.post(`${API_URL}/admin/vouchers`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newVoucher = { ...mockVouchers[0], ...body, _id: `voucher-new-${Date.now()}` }
    return HttpResponse.json(
      { message: 'Tạo voucher thành công', data: newVoucher },
      { status: 201 },
    )
  }),

  http.put(`${API_URL}/admin/vouchers/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const voucher = mockVouchers.find((v) => v._id === params.id)
    if (!voucher) {
      return HttpResponse.json({ message: 'Không tìm thấy voucher' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Cập nhật thành công', data: { ...voucher, ...body } })
  }),

  http.delete(`${API_URL}/admin/vouchers/:id`, () => {
    return HttpResponse.json({ message: 'Xóa voucher thành công', data: null })
  }),
]

export default vouchersHandlers
