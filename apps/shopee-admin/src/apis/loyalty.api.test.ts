import { describe, it, expect, vi, beforeEach } from 'vitest'
import loyaltyApi from './loyalty.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('loyalty.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getRewards calls GET /admin/loyalty/rewards', () => {
    loyaltyApi.getRewards({ page: 1, limit: 10, is_active: true })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/loyalty/rewards', {
      params: { page: 1, limit: 10, is_active: true },
    })
  })

  it('createReward calls POST /admin/loyalty/rewards', () => {
    const body = { name: 'Reward', description: 'Desc', points_required: 100 }
    loyaltyApi.createReward(body)
    expect(mockHttp.post).toHaveBeenCalledWith('admin/loyalty/rewards', body)
  })

  it('updateReward calls PUT /admin/loyalty/rewards/:id', () => {
    loyaltyApi.updateReward('r-1', { name: 'Updated' })
    expect(mockHttp.put).toHaveBeenCalledWith('admin/loyalty/rewards/r-1', { name: 'Updated' })
  })

  it('deleteReward calls DELETE /admin/loyalty/rewards/:id', () => {
    loyaltyApi.deleteReward('r-1')
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/loyalty/rewards/r-1')
  })

  it('toggleReward calls PATCH /admin/loyalty/rewards/:id/toggle', () => {
    loyaltyApi.toggleReward('r-1')
    expect(mockHttp.patch).toHaveBeenCalledWith('admin/loyalty/rewards/r-1/toggle')
  })

  it('adjustPoints calls POST /admin/loyalty/points/adjust', () => {
    const body = { user_id: 'u-1', points: 50, description: 'Bonus' }
    loyaltyApi.adjustPoints(body)
    expect(mockHttp.post).toHaveBeenCalledWith('admin/loyalty/points/adjust', body)
  })

  it('getTransactions calls GET /admin/loyalty/transactions', () => {
    loyaltyApi.getTransactions({ page: 1, limit: 10, type: 'earn' })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/loyalty/transactions', {
      params: { page: 1, limit: 10, type: 'earn' },
    })
  })

  it('getStats calls GET /admin/loyalty/stats', () => {
    loyaltyApi.getStats()
    expect(mockHttp.get).toHaveBeenCalledWith('admin/loyalty/stats')
  })
})
