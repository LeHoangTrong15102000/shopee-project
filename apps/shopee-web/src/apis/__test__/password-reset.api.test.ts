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

import http from 'src/utils/http'
import passwordResetApi from '../password-reset.api'

describe('Password Reset API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('forgotPassword', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'Email sent' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await passwordResetApi.forgotPassword('test@test.com')
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(passwordResetApi.forgotPassword('test@test.com')).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('resetPassword', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'Password reset' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await passwordResetApi.resetPassword('token', 'newpass', 'newpass')
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(passwordResetApi.resetPassword('token', 'newpass', 'newpass')).rejects.toThrow(
        'Network error',
      )
    })
  })
})
