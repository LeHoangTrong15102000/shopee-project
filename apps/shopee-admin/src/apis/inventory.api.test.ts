import { describe, it, expect, vi, beforeEach } from 'vitest'
import inventoryApi from './inventory.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('inventory.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getLowStock calls GET /admin/inventory/low-stock', () => {
    inventoryApi.getLowStock({ page: 1, limit: 10, threshold: 5 })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/inventory/low-stock', {
      params: { page: 1, limit: 10, threshold: 5 },
    })
  })

  it('getOutOfStock calls GET /admin/inventory/out-of-stock', () => {
    inventoryApi.getOutOfStock({ page: 1, limit: 10 })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/inventory/out-of-stock', {
      params: { page: 1, limit: 10 },
    })
  })

  it('updateStock calls PUT /admin/inventory/:id/stock', () => {
    inventoryApi.updateStock('prod-1', { quantity: 50 })
    expect(mockHttp.put).toHaveBeenCalledWith('admin/inventory/prod-1/stock', { quantity: 50 })
  })

  it('bulkUpdateStock calls PUT /admin/inventory/bulk-stock', () => {
    const body = { items: [{ product_id: 'p1', quantity: 10 }] }
    inventoryApi.bulkUpdateStock(body)
    expect(mockHttp.put).toHaveBeenCalledWith('admin/inventory/bulk-stock', body)
  })
})
