import { describe, it, expect, vi, beforeEach } from 'vitest'
import ordersApi from './orders.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('orders.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getOrders calls GET /admin/orders with params', () => {
    const params = { page: 1, limit: 10, status: 'pending' as const }
    ordersApi.getOrders(params)
    expect(mockHttp.get).toHaveBeenCalledWith('admin/orders', { params })
  })

  it('getOrder calls GET /admin/orders/:id', () => {
    ordersApi.getOrder('order-1')
    expect(mockHttp.get).toHaveBeenCalledWith('admin/orders/order-1')
  })

  it('getOrderCountByStatus calls GET /admin/orders/count-by-status', () => {
    ordersApi.getOrderCountByStatus()
    expect(mockHttp.get).toHaveBeenCalledWith('admin/orders/count-by-status')
  })

  it('updateOrderStatus calls PUT /admin/orders/:id/status', () => {
    ordersApi.updateOrderStatus('order-1', { status: 'shipped' })
    expect(mockHttp.put).toHaveBeenCalledWith('admin/orders/order-1/status', { status: 'shipped' })
  })

  it('bulkUpdateStatus calls PUT /admin/orders/bulk-status', () => {
    const body = { order_ids: ['o1', 'o2'], status: 'delivered' as const }
    ordersApi.bulkUpdateStatus(body)
    expect(mockHttp.put).toHaveBeenCalledWith('admin/orders/bulk-status', body)
  })
})
