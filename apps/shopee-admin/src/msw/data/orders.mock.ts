import { createMockOrder } from 'src/test-utils/factories'
import type { Order } from 'src/types'

export const mockOrders: Order[] = [
  createMockOrder({ _id: 'order-1', status: 'pending', total_price: 29990000 }),
  createMockOrder({ _id: 'order-2', status: 'processing', total_price: 22990000 }),
  createMockOrder({ _id: 'order-3', status: 'shipped', total_price: 49990000 }),
  createMockOrder({ _id: 'order-4', status: 'delivered', total_price: 16990000 }),
  createMockOrder({ _id: 'order-5', status: 'cancelled', total_price: 5990000 }),
]
