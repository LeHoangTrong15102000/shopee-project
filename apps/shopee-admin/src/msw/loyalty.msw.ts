import { http, HttpResponse } from 'msw'
import { mockRewards, mockTransactions, mockLoyaltyStats } from './data/loyalty.mock'
import { API_URL } from './msw-utils'

const loyaltyHandlers = [
  http.get(`${API_URL}/admin/loyalty/rewards`, () => {
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        rewards: mockRewards,
        pagination: { page: 1, limit: 10, total: mockRewards.length, totalPages: 1 },
      },
    })
  }),

  http.post(`${API_URL}/admin/loyalty/rewards`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        message: 'Tạo phần thưởng thành công',
        data: { ...mockRewards[0], ...body, _id: `reward-new-${Date.now()}` },
      },
      { status: 201 },
    )
  }),

  http.put(`${API_URL}/admin/loyalty/rewards/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const reward = mockRewards.find((r) => r._id === params.id) ?? mockRewards[0]
    return HttpResponse.json({
      message: 'Cập nhật phần thưởng thành công',
      data: { ...reward, ...body },
    })
  }),

  http.delete(`${API_URL}/admin/loyalty/rewards/:id`, () => {
    return HttpResponse.json({ message: 'Xóa phần thưởng thành công', data: null })
  }),

  http.post(`${API_URL}/admin/loyalty/points/adjust`, async ({ request }) => {
    const body = (await request.json()) as { user_id: string; points: number; description: string }
    return HttpResponse.json({
      message: 'Điều chỉnh điểm thành công',
      data: {
        _id: `tx-new-${Date.now()}`,
        user: body.user_id,
        type: 'adjust',
        points: body.points,
        description: body.description,
        createdAt: new Date().toISOString(),
      },
    })
  }),

  http.get(`${API_URL}/admin/loyalty/transactions`, () => {
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        transactions: mockTransactions,
        pagination: { page: 1, limit: 10, total: mockTransactions.length, totalPages: 1 },
      },
    })
  }),

  http.get(`${API_URL}/admin/loyalty/stats`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockLoyaltyStats })
  }),
]

export default loyaltyHandlers
