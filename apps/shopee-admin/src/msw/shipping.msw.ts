import { http, HttpResponse } from 'msw'
import { API_URL } from './msw-utils'

const mockShippingMethods = [
  {
    _id: 'ship-1',
    name: 'Standard Shipping',
    code: 'standard',
    description: 'Delivery in 5-7 business days',
    price: 30000,
    estimated_days_min: 5,
    estimated_days_max: 7,
    is_active: true,
    sort_order: 1,
    icon: '📦',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'ship-2',
    name: 'Express Shipping',
    code: 'express',
    description: 'Delivery in 1-2 business days',
    price: 60000,
    estimated_days_min: 1,
    estimated_days_max: 2,
    is_active: true,
    sort_order: 2,
    icon: '📦',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'ship-3',
    name: 'Economy',
    code: 'economy',
    description: null,
    price: 15000,
    estimated_days_min: 10,
    estimated_days_max: 14,
    is_active: false,
    sort_order: 3,
    icon: '📦',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

const shippingHandlers = [
  http.get(`${API_URL}/admin/shipping-methods`, () => {
    return HttpResponse.json({ message: 'Success', data: mockShippingMethods })
  }),

  http.post(`${API_URL}/admin/shipping-methods`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newMethod = { ...mockShippingMethods[0], ...body, _id: `ship-new-${Date.now()}` }
    return HttpResponse.json({ message: 'Tạo thành công', data: newMethod }, { status: 201 })
  }),

  http.put(`${API_URL}/admin/shipping-methods/reorder`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ message: 'Cập nhật thứ tự thành công', data: body })
  }),

  http.put(`${API_URL}/admin/shipping-methods/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const method = mockShippingMethods.find((m) => m._id === params.id)
    if (!method) return HttpResponse.json({ message: 'Không tìm thấy' }, { status: 404 })
    return HttpResponse.json({ message: 'Cập nhật thành công', data: { ...method, ...body } })
  }),

  http.patch(`${API_URL}/admin/shipping-methods/:id/toggle`, ({ params }) => {
    const method = mockShippingMethods.find((m) => m._id === params.id)
    if (!method) return HttpResponse.json({ message: 'Không tìm thấy' }, { status: 404 })
    return HttpResponse.json({ message: 'Cập nhật thành công', data: { ...method, is_active: !method.is_active } })
  }),

  http.delete(`${API_URL}/admin/shipping-methods/:id`, () => {
    return HttpResponse.json({ message: 'Xóa thành công', data: null })
  }),
]

export default shippingHandlers
