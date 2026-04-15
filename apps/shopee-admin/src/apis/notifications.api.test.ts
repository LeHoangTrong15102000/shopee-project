import { describe, it, expect, vi, beforeEach } from 'vitest'
import notificationsApi from './notifications.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('notifications.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getNotifications calls GET /admin/notifications with params', () => {
    notificationsApi.getNotifications({ page: 1, limit: 10, type: 'broadcast' })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/notifications', {
      params: { page: 1, limit: 10, type: 'broadcast' },
    })
  })

  it('createNotification calls POST /admin/notifications', () => {
    const body = { user_id: 'u-1', title: 'Test', message: 'Hello' }
    notificationsApi.createNotification(body)
    expect(mockHttp.post).toHaveBeenCalledWith('admin/notifications', body)
  })

  it('broadcastNotification calls POST /admin/notifications/broadcast', () => {
    const body = { title: 'Broadcast', message: 'Hello all' }
    notificationsApi.broadcastNotification(body)
    expect(mockHttp.post).toHaveBeenCalledWith('admin/notifications/broadcast', body)
  })

  it('deleteNotification calls DELETE /admin/notifications/:id', () => {
    notificationsApi.deleteNotification('n-1')
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/notifications/n-1')
  })

  it('markAsRead calls PUT /admin/notifications/:id/read', () => {
    notificationsApi.markAsRead('n-1')
    expect(mockHttp.put).toHaveBeenCalledWith('admin/notifications/n-1/read')
  })
})
