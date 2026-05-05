import { http, HttpResponse } from 'msw'
import { API_URL } from './msw-utils'

const mockPaymentMethods = [
  {
    _id: 'pay-1',
    name: 'Credit Card',
    code: 'credit_card',
    description: 'Visa, Mastercard, JCB',
    is_enabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'pay-2',
    name: 'Cash on Delivery',
    code: 'cod',
    description: 'Pay when you receive',
    is_enabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'pay-3',
    name: 'Bank Transfer',
    code: 'bank_transfer',
    description: null,
    is_enabled: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

const paymentsHandlers = [
  http.get(`${API_URL}/orders/payment/methods`, () => {
    return HttpResponse.json({ message: 'Success', data: mockPaymentMethods })
  }),
]

export default paymentsHandlers
