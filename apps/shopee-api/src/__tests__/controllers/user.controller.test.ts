/**
 * Unit Tests cho User Controller
 * Test các chức năng CRUD user
 */

/// <reference types="jest" />
import { Request, Response } from 'express'
import userController from '@controllers/user.controller'
import { STATUS } from '@constants/status'
import { NotFoundError, ValidationError, ConflictError } from '@services/base.service'

jest.mock('../../container', () => ({
  userService: {
    createUser: jest.fn(),
    getUsers: jest.fn(),
    getProfile: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    updateProfile: jest.fn(),
    deleteUser: jest.fn(),
    setPassword: jest.fn(),
  },
  auditLogService: {
    writeLog: jest.fn(),
  },
}))

import { userService } from '../../container'

const mockUserService = userService as jest.Mocked<typeof userService>

const createMockRequest = (
  options: { body?: any; params?: any; query?: any; jwtDecoded?: any; headers?: any } = {},
): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  jwtDecoded: options.jwtDecoded,
  headers: options.headers || {},
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockUser = {
  _id: 'user_1',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['User'],
}

const jwtDecoded = {
  id: 'user_1',
  email: 'test@example.com',
  roles: ['User'],
  created_at: new Date().toISOString(),
  jti: 'test-jti-fixture',
}

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addUser', () => {
    it('should create user successfully', async () => {
      mockUserService.createUser.mockResolvedValue(mockUser as any)
      const req = createMockRequest({
        body: { email: 'test@example.com', password: 'pass123', name: 'Test', roles: ['User'] },
        jwtDecoded,
      })
      const res = createMockResponse()

      await userController.addUser(req as any, res as Response)

      expect(mockUserService.createUser).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when email exists', async () => {
      mockUserService.createUser.mockRejectedValue(new ConflictError('Email đã tồn tại'))
      const req = createMockRequest({
        body: { email: 'existing@example.com', password: 'pass123' },
        jwtDecoded,
      })
      const res = createMockResponse()

      await expect(userController.addUser(req as any, res as Response)).rejects.toMatchObject({
        status: 422,
      })
    })
  })

  describe('getUsers', () => {
    it('should return all users', async () => {
      mockUserService.getUsers.mockResolvedValue({
        data: [mockUser],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      } as any)
      const req = createMockRequest({ jwtDecoded })
      const res = createMockResponse()

      await userController.getUsers(req as any, res as Response)

      expect(mockUserService.getUsers).toHaveBeenCalledWith({ page: 1, limit: 10 })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })
  })

  describe('getDetailMySelf', () => {
    it('should return own profile', async () => {
      mockUserService.getProfile.mockResolvedValue(mockUser as any)
      const req = createMockRequest({ jwtDecoded })
      const res = createMockResponse()

      await userController.getDetailMySelf(req as any, res as Response)

      expect(mockUserService.getProfile).toHaveBeenCalledWith('user_1')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when jwtDecoded is missing', async () => {
      const req = createMockRequest({})
      const res = createMockResponse()

      await expect(
        userController.getDetailMySelf(req as any, res as Response),
      ).rejects.toMatchObject({ status: STATUS.UNAUTHORIZED })
    })

    it('should throw error when user not found', async () => {
      mockUserService.getProfile.mockRejectedValue(new NotFoundError('User', 'user_1'))
      const req = createMockRequest({ jwtDecoded })
      const res = createMockResponse()

      await expect(
        userController.getDetailMySelf(req as any, res as Response),
      ).rejects.toMatchObject({ status: STATUS.UNAUTHORIZED })
    })
  })

  describe('getUser', () => {
    it('should return user by id', async () => {
      mockUserService.getUserById.mockResolvedValue(mockUser as any)
      const req = createMockRequest({ params: { user_id: 'user_1' }, jwtDecoded })
      const res = createMockResponse()

      await userController.getUser(req as any, res as Response)

      expect(mockUserService.getUserById).toHaveBeenCalledWith('user_1')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when user not found', async () => {
      mockUserService.getUserById.mockRejectedValue(new NotFoundError('User', 'user_999'))
      const req = createMockRequest({ params: { user_id: 'user_999' }, jwtDecoded })
      const res = createMockResponse()

      await expect(userController.getUser(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updated = { ...mockUser, name: 'Updated' }
      mockUserService.updateUser.mockResolvedValue(updated as any)
      const req = createMockRequest({
        params: { user_id: 'user_1' },
        body: { name: 'Updated' },
        jwtDecoded,
      })
      const res = createMockResponse()

      await userController.updateUser(req as any, res as Response)

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user_1', expect.any(Object))
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when user not found', async () => {
      mockUserService.updateUser.mockRejectedValue(new NotFoundError('User', 'user_999'))
      const req = createMockRequest({
        params: { user_id: 'user_999' },
        body: { name: 'Updated' },
        jwtDecoded,
      })
      const res = createMockResponse()

      await expect(userController.updateUser(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })
  })

  describe('updateMe', () => {
    it('should update own profile successfully (non-password change, tokens null)', async () => {
      const updated = { ...mockUser, name: 'New Name' }
      mockUserService.updateProfile.mockResolvedValue({ user: updated, tokens: null } as any)
      const req = createMockRequest({
        body: { name: 'New Name' },
        jwtDecoded,
      })
      const res = createMockResponse()

      await userController.updateMe(req as any, res as Response)

      expect(mockUserService.updateProfile).toHaveBeenCalledWith(
        'user_1',
        expect.any(Object),
        'test-jti-fixture',
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      // Non-password update: response data should have user but not token fields
      const sentData = (res.send as jest.Mock).mock.calls[0]?.[0]
      if (sentData) {
        expect(sentData.data.user).toEqual(updated)
        expect(sentData.data.access_token).toBeUndefined()
        expect(sentData.data.refresh_token).toBeUndefined()
      }
    })

    it('should include fresh token pair in response when password changes (tokens non-null)', async () => {
      const updated = { ...mockUser, name: 'Same Name' }
      const freshTokens = {
        access_token: 'Bearer new-access-token',
        expires: 86400,
        refresh_token: 'new-refresh-token',
        expires_refresh_token: 604800,
        accessJti: 'new-access-jti',
        refreshJti: 'new-refresh-jti',
      }
      mockUserService.updateProfile.mockResolvedValue({ user: updated, tokens: freshTokens } as any)
      const req = createMockRequest({
        // Both password + new_password present → isPasswordChange = true
        body: { password: 'old-pass', new_password: 'new-pass' },
        jwtDecoded,
      })
      const res = createMockResponse()

      await userController.updateMe(req as any, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      // The response data should spread the token fields alongside user
      const sendCall = (res.send as jest.Mock).mock.calls[0]?.[0]
      if (sendCall) {
        expect(sendCall.data.access_token).toBe(freshTokens.access_token)
        expect(sendCall.data.refresh_token).toBe(freshTokens.refresh_token)
      }
    })

    it('should throw error when jwtDecoded is missing', async () => {
      const req = createMockRequest({ body: { name: 'New Name' } })
      const res = createMockResponse()

      await expect(userController.updateMe(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.UNAUTHORIZED,
      })
    })

    it('should throw validation error with field', async () => {
      mockUserService.updateProfile.mockRejectedValue(
        new ValidationError('Password không đúng', 'password'),
      )
      const req = createMockRequest({
        body: { password: 'wrong', new_password: 'new123' },
        jwtDecoded,
      })
      const res = createMockResponse()

      await expect(userController.updateMe(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.UNPROCESSABLE_ENTITY,
      })
    })
  })

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserService.deleteUser.mockResolvedValue(undefined)
      const req = createMockRequest({ params: { user_id: 'user_1' }, jwtDecoded })
      const res = createMockResponse()

      await userController.deleteUser(req as any, res as Response)

      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user_1')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when user not found', async () => {
      mockUserService.deleteUser.mockRejectedValue(new NotFoundError('User', 'user_999'))
      const req = createMockRequest({ params: { user_id: 'user_999' }, jwtDecoded })
      const res = createMockResponse()

      await expect(userController.deleteUser(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })
  })

  describe('setPassword', () => {
    it('should return fresh token pair on success', async () => {
      const freshTokens = {
        access_token: 'Bearer new-access-token',
        expires: 86400,
        refresh_token: 'new-refresh-token',
        expires_refresh_token: 604800,
        accessJti: 'new-access-jti',
        refreshJti: 'new-refresh-jti',
      }
      mockUserService.setPassword.mockResolvedValue(freshTokens as any)
      const req = createMockRequest({
        body: { new_password: 'MyNewPass1!', confirm_password: 'MyNewPass1!' },
        jwtDecoded,
      })
      const res = createMockResponse()

      await userController.setPassword(req as any, res as Response)

      expect(mockUserService.setPassword).toHaveBeenCalledWith(
        'user_1',
        'MyNewPass1!',
        'test-jti-fixture',
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      const sendCall = (res.send as jest.Mock).mock.calls[0]?.[0]
      if (sendCall) {
        expect(sendCall.data.access_token).toBe(freshTokens.access_token)
        expect(sendCall.data.refresh_token).toBe(freshTokens.refresh_token)
      }
    })

    it('should map ValidationError to 422', async () => {
      mockUserService.setPassword.mockRejectedValue(
        new ValidationError('Password không hợp lệ', 'new_password'),
      )
      const req = createMockRequest({
        body: { new_password: 'weak', confirm_password: 'weak' },
        jwtDecoded,
      })
      const res = createMockResponse()

      await expect(userController.setPassword(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.UNPROCESSABLE_ENTITY,
      })
    })

    it('should throw UNAUTHORIZED when jwtDecoded is missing', async () => {
      const req = createMockRequest({
        body: { new_password: 'MyNewPass1!', confirm_password: 'MyNewPass1!' },
      })
      const res = createMockResponse()

      await expect(userController.setPassword(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.UNAUTHORIZED,
      })
    })
  })
})
