import { describe, it, expect, vi, beforeEach } from 'vitest'
import authApi from './auth.api'

vi.mock('src/utils/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
  // Mock the named export used by authApi.logout()
  getRefreshTokenFromLS: vi.fn(() => 'mock-refresh-token'),
}))

import http from 'src/utils/http'

const mockHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
}

describe('auth.api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login calls POST /login with body', () => {
    const body = { email: 'admin@test.com', password: '123456' }
    authApi.login(body)
    expect(mockHttp.post).toHaveBeenCalledWith('login', body)
  })

  it('logout calls POST /logout with refresh_token body', () => {
    authApi.logout()
    expect(mockHttp.post).toHaveBeenCalledWith('logout', { refresh_token: 'mock-refresh-token' })
  })
})
