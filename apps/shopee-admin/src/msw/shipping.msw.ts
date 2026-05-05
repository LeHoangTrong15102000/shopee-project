import { http, HttpResponse } from 'msw'
import { API_URL } from './msw-utils'

const mockShippingMethods = [
  {
    _id: 'ship-1',
    name: 'Standard Shipping',
    code: 'standard',
    description: 'Delivery in 5-7 business days',
    base_cost: 30000,
    estimated_days: 7,
    is_active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'ship-2',
    name: 'Express Shipping',
    code: 'express',
    description: 'Delivery in 1-2 business days',
    base_cost: 60000,
    estimated_days: 2,
    is_active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'ship-3',
    name: 'Economy',
    code: 'economy',
    description: null,
    base_cost: 15000,
    estimated_days: 14,
    is_active: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

const shippingHandlers = [
  http.get(`${API_URL}/orders/shipping/methods`, () => {
    return HttpResponse.json({ message: 'Success', data: mockShippingMethods })
  }),
]

export default shippingHandlers
