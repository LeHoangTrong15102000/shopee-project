import { describe, it, expect, vi, beforeEach } from 'vitest'
import settingsApi from './settings.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('settings.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getProfile calls GET /me', () => {
    settingsApi.getProfile()
    expect(mockHttp.get).toHaveBeenCalledWith('me')
  })

  it('updateProfile calls PUT /me with body', () => {
    const body = { name: 'Updated Name', phone: '0901234567' }
    settingsApi.updateProfile(body)
    expect(mockHttp.put).toHaveBeenCalledWith('me', body)
  })
})
