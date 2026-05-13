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
import userApi from '../user.api'

describe('User API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', name: 'User' } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await userApi.getProfile()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(userApi.getProfile()).rejects.toThrow('Network error')
    })
  })

  describe('updateProfile', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', name: 'Updated' } } }
      vi.mocked(http.put).mockResolvedValue(mockResponse as any)
      const result = await userApi.updateProfile({ name: 'Updated' })
      expect(http.put).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'))
      await expect(userApi.updateProfile({ name: 'Updated' })).rejects.toThrow('Network error')
    })
  })

  describe('uploadAvatar', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: 'avatar-url' } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const formData = new FormData()
      const result = await userApi.uploadAvatar(formData)
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const formData = new FormData()
      await expect(userApi.uploadAvatar(formData)).rejects.toThrow('Network error')
    })
  })
})
