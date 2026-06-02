import { http, HttpResponse } from 'msw'
import { API_URL } from './msw-utils'

const mockPaymentMethods = [
  {
    _id: 'pay-1',
    name: 'Credit Card',
    code: 'credit_card',
    description: 'Visa, Mastercard, JCB',
    is_active: true,
    sort_order: 1,
    icon: '💳',
    type: 'credit_card',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'pay-2',
    name: 'Cash on Delivery',
    code: 'cod',
    description: 'Pay when you receive',
    is_active: true,
    sort_order: 2,
    icon: '💳',
    type: 'ewallet',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'pay-3',
    name: 'Bank Transfer',
    code: 'bank_transfer',
    description: null,
    is_active: false,
    sort_order: 3,
    icon: '💳',
    type: 'bank_transfer',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

const paymentsHandlers = [
  http.get(`${API_URL}/admin/payment-methods`, () => {
    return HttpResponse.json({ message: 'Success', data: mockPaymentMethods })
  }),

  http.post(`${API_URL}/admin/payment-methods`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newMethod = { ...mockPaymentMethods[0], ...body, _id: `pay-new-${Date.now()}` }
    return HttpResponse.json({ message: 'Tạo thành công', data: newMethod }, { status: 201 })
  }),

  http.put(`${API_URL}/admin/payment-methods/reorder`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ message: 'Cập nhật thứ tự thành công', data: body })
  }),

  http.put(`${API_URL}/admin/payment-methods/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const method = mockPaymentMethods.find((m) => m._id === params.id)
    if (!method) return HttpResponse.json({ message: 'Không tìm thấy' }, { status: 404 })
    return HttpResponse.json({ message: 'Cập nhật thành công', data: { ...method, ...body } })
  }),

  http.patch(`${API_URL}/admin/payment-methods/:id/toggle`, ({ params }) => {
    const method = mockPaymentMethods.find((m) => m._id === params.id)
    if (!method) return HttpResponse.json({ message: 'Không tìm thấy' }, { status: 404 })
    return HttpResponse.json({
      message: 'Cập nhật thành công',
      data: { ...method, is_active: !method.is_active },
    })
  }),

  http.delete(`${API_URL}/admin/payment-methods/:id`, () => {
    return HttpResponse.json({ message: 'Xóa thành công', data: null })
  }),
]

export default paymentsHandlers
