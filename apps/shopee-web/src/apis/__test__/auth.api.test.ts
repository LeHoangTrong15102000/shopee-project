import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('src/utils/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

// Mock auth storage helpers so tests don't depend on localStorage
vi.mock('src/utils/auth', () => ({
  getRefreshTokenFromLS: vi.fn(() => 'mock-refresh-token'),
  getAccessTokenFromLS: vi.fn(() => ''),
  setAccessTokenToLS: vi.fn(),
  setRefreshTokenToLS: vi.fn(),
  setProfileToLS: vi.fn(),
  clearLS: vi.fn(),
  LocalStorageEventTarget: new EventTarget(),
}))

import http from 'src/utils/http'
import authApi from '../auth.api'
import userApi from '../user.api'

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerAccount', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { access_token: 'token', user: {} } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await authApi.registerAccount({ email: 'test@test.com', password: 'pass' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(
        authApi.registerAccount({ email: 'test@test.com', password: 'pass' }),
      ).rejects.toThrow('Network error')
    })
  })

  describe('loginAccount', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { access_token: 'token', user: {} } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await authApi.loginAccount({ email: 'test@test.com', password: 'pass' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(
        authApi.loginAccount({ email: 'test@test.com', password: 'pass' }),
      ).rejects.toThrow('Network error')
    })
  })

  describe('logoutAccount', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok' } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await authApi.logoutAccount()
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(authApi.logoutAccount()).rejects.toThrow('Network error')
    })
  })

  describe('refreshAccessToken', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { access_token: 'new-token' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await authApi.refreshAccessToken({ refresh_token: 'refresh' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(authApi.refreshAccessToken({ refresh_token: 'refresh' })).rejects.toThrow(
        'Network error',
      )
    })
  })
})

/** TokenPair fixture shared across the password-change response shape tests */
const freshTokenPair = {
  access_token: 'Bearer fresh-access-token',
  refresh_token: 'fresh-refresh-token',
  expires: 86400,
  expires_refresh_token: 604800,
  accessJti: 'fresh-access-jti',
  refreshJti: 'fresh-refresh-jti',
}

describe('User API — password-change response shape', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateProfile', () => {
    it('carries user field in the response data', async () => {
      const mockUser = { _id: '1', name: 'Alice', email: 'alice@test.com' }
      const mockResponse = {
        data: {
          message: 'ok',
          data: { user: mockUser, ...freshTokenPair },
        },
      }
      vi.mocked(http.put).mockResolvedValue(mockResponse as any)

      const result = await userApi.updateProfile({ password: 'old', new_password: 'new' })

      expect(http.put).toHaveBeenCalled()
      expect(result.data.data.user).toEqual(mockUser)
    })

    it('carries TokenPair fields (access_token, refresh_token, expires, expires_refresh_token, accessJti, refreshJti) on password-change response', async () => {
      const mockResponse = {
        data: {
          message: 'ok',
          data: {
            user: { _id: '1', name: 'Alice', email: 'alice@test.com' },
            ...freshTokenPair,
          },
        },
      }
      vi.mocked(http.put).mockResolvedValue(mockResponse as any)

      const result = await userApi.updateProfile({ password: 'old', new_password: 'new' })
      const data = result.data.data

      expect(data.access_token).toBe(freshTokenPair.access_token)
      expect(data.refresh_token).toBe(freshTokenPair.refresh_token)
      expect(data.expires).toBe(freshTokenPair.expires)
      expect(data.expires_refresh_token).toBe(freshTokenPair.expires_refresh_token)
      expect(data.accessJti).toBe(freshTokenPair.accessJti)
      expect(data.refreshJti).toBe(freshTokenPair.refreshJti)
    })

    it('throws on network error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'))
      await expect(userApi.updateProfile({ name: 'Alice' })).rejects.toThrow('Network error')
    })
  })

  describe('setPassword', () => {
    it('carries TokenPair fields (access_token, refresh_token, expires, expires_refresh_token, accessJti, refreshJti) in response', async () => {
      const mockResponse = {
        data: {
          message: 'ok',
          data: { ...freshTokenPair },
        },
      }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)

      const result = await userApi.setPassword({
        new_password: 'MyPass1!',
        confirm_password: 'MyPass1!',
      })
      const data = result.data.data

      expect(http.post).toHaveBeenCalled()
      expect(data.access_token).toBe(freshTokenPair.access_token)
      expect(data.refresh_token).toBe(freshTokenPair.refresh_token)
      expect(data.expires).toBe(freshTokenPair.expires)
      expect(data.expires_refresh_token).toBe(freshTokenPair.expires_refresh_token)
      expect(data.accessJti).toBe(freshTokenPair.accessJti)
      expect(data.refreshJti).toBe(freshTokenPair.refreshJti)
    })

    it('throws on network error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(
        userApi.setPassword({ new_password: 'MyPass1!', confirm_password: 'MyPass1!' }),
      ).rejects.toThrow('Network error')
    })
  })
})
