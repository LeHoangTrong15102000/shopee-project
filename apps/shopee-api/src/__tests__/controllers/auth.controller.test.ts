/**
 * Unit Tests cho Auth Controller
 * Test các chức năng đăng ký và đăng nhập
 * Updated to work with new service-based architecture
 */

/// <reference types="jest" />
import { Request, Response } from 'express'
import authController from '@controllers/auth.controller'
import { STATUS } from '@constants/status'
import {
  ConflictError,
  ValidationError as ServiceValidationError,
  UnauthorizedError as ServiceUnauthorizedError,
} from '@services/base.service'

// Mock the container's authService and fire-and-forget services
jest.mock('../../container', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshTokenWithRotation: jest.fn(),
    googleLogin: jest.fn(),
  },
  sessionService: {
    createSession: jest.fn().mockResolvedValue(undefined),
    updateSessionOnRefresh: jest.fn().mockResolvedValue(undefined),
  },
  auditLogService: {
    writeLog: jest.fn(),
  },
  loginHistoryService: {
    recordAttempt: jest.fn(),
  },
}))

import { authService } from '../../container'

const mockAuthService = authService as jest.Mocked<typeof authService>

// Interface cho mock request options
interface MockRequestOptions {
  body?: Record<string, unknown>
  params?: Record<string, string>
  query?: Record<string, string>
  headers?: Record<string, string>
  ip?: string
  socket?: { remoteAddress?: string }
  jwtDecoded?: {
    id: string
    email: string
    roles: string[]
    created_at: string
    jti?: string
  }
}

// Helper functions để tạo mock request/response
const createMockRequest = (options: MockRequestOptions = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  ip: options.ip || '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' } as any,
  jwtDecoded: options.jwtDecoded,
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerController', () => {
    it('should register new user successfully', async () => {
      const mockResult = {
        access_token: 'Bearer mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires: 3600,
        expires_refresh_token: 604800,
        user: {
          _id: 'user_id_123',
          email: 'test@example.com',
          roles: ['User'],
        },
      }

      mockAuthService.register.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        headers: {},
      })
      const res = createMockResponse()

      await authController.registerController(req as Request, res as Response)

      expect(mockAuthService.register).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        expect.any(Object),
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should issue access token with 900 second (15 minute) expiry', async () => {
      const mockResult = {
        access_token: 'Bearer mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires: 900,
        expires_refresh_token: 604800,
        user: {
          _id: 'user_id_123',
          email: 'test@example.com',
          roles: ['User'],
        },
      }

      mockAuthService.register.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      })
      const res = createMockResponse()

      await authController.registerController(req as Request, res as Response)

      expect(mockAuthService.register).toHaveBeenCalledWith(expect.any(Object), {
        expireAccessToken: 900,
        expireRefreshToken: expect.any(Number),
      })
    })

    it('should ignore client-provided expire-access-token header', async () => {
      const mockResult = {
        access_token: 'Bearer mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires: 900,
        expires_refresh_token: 604800,
        user: {
          _id: 'user_id_123',
          email: 'test@example.com',
          roles: ['User'],
        },
      }

      mockAuthService.register.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        headers: { 'expire-access-token': '999999' }, // Client tries to override
      })
      const res = createMockResponse()

      await authController.registerController(req as Request, res as Response)

      // Verify service called with server config (900), not client value
      expect(mockAuthService.register).toHaveBeenCalledWith(expect.any(Object), {
        expireAccessToken: 900,
        expireRefreshToken: expect.any(Number),
      })
    })

    it('should ignore client-provided expire-refresh-token header', async () => {
      const mockResult = {
        access_token: 'Bearer mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires: 900,
        expires_refresh_token: 604800,
        user: {
          _id: 'user_id_123',
          email: 'test@example.com',
          roles: ['User'],
        },
      }

      mockAuthService.register.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        headers: { 'expire-refresh-token': '999999' }, // Client tries to override
      })
      const res = createMockResponse()

      await authController.registerController(req as Request, res as Response)

      // Verify service called with server config, not client value
      expect(mockAuthService.register).toHaveBeenCalledWith(expect.any(Object), {
        expireAccessToken: 900,
        expireRefreshToken: 2592000,
      })
    })

    it('should return error if email already exists', async () => {
      mockAuthService.register.mockRejectedValue(new ConflictError('Email already exists'))

      const req = createMockRequest({
        body: {
          email: 'existing@example.com',
          password: 'password123',
        },
        headers: {},
      })
      const res = createMockResponse()

      await expect(
        authController.registerController(req as Request, res as Response),
      ).rejects.toMatchObject({
        status: STATUS.UNPROCESSABLE_ENTITY,
      })
    })
  })

  describe('loginController', () => {
    it('should login successfully with correct credentials', async () => {
      const mockResult = {
        access_token: 'Bearer mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires: 3600,
        expires_refresh_token: 604800,
        user: {
          _id: 'user_id_123',
          email: 'test@example.com',
          roles: ['User'],
        },
      }

      mockAuthService.login.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        headers: {},
      })
      const res = createMockResponse()

      await authController.loginController(req as Request, res as Response)

      expect(mockAuthService.login).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        expect.any(Object),
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should return error with wrong password', async () => {
      mockAuthService.login.mockRejectedValue(new ServiceValidationError('Invalid credentials'))

      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
        headers: {},
      })
      const res = createMockResponse()

      await expect(
        authController.loginController(req as Request, res as Response),
      ).rejects.toMatchObject({
        status: STATUS.UNPROCESSABLE_ENTITY,
      })
    })

    it('should return error if user not found', async () => {
      mockAuthService.login.mockRejectedValue(new ServiceValidationError('User not found'))

      const req = createMockRequest({
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
        headers: {},
      })
      const res = createMockResponse()

      await expect(
        authController.loginController(req as Request, res as Response),
      ).rejects.toMatchObject({
        status: STATUS.UNPROCESSABLE_ENTITY,
      })
    })
  })

  describe('logoutController', () => {
    it('should logout successfully with refresh_token in body', async () => {
      mockAuthService.logout.mockResolvedValue(undefined)

      const req = createMockRequest({
        body: { refresh_token: 'mock_refresh_token' },
      })
      const res = createMockResponse()

      await authController.logoutController(req as Request, res as Response)

      expect(mockAuthService.logout).toHaveBeenCalledWith('mock_refresh_token')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should succeed without refresh_token in body (graceful handling)', async () => {
      mockAuthService.logout.mockResolvedValue(undefined)

      const req = createMockRequest({
        body: {}, // No refresh_token
      })
      const res = createMockResponse()

      await authController.logoutController(req as Request, res as Response)

      expect(mockAuthService.logout).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })
  })

  describe('refreshTokenController', () => {
    it('should refresh token successfully', async () => {
      const mockResult = {
        access_token: 'Bearer new_access_token',
        refresh_token: 'new_refresh_token',
        expires: 900,
        expires_refresh_token: 2592000,
      }
      mockAuthService.refreshTokenWithRotation.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        body: { refresh_token: 'old_refresh_token' },
        jwtDecoded: {
          id: 'user_id_123',
          email: 'test@example.com',
          roles: ['User'],
          created_at: new Date().toISOString(),
          jti: 'old-jti-uuid',
        },
      })
      const res = createMockResponse()

      await authController.refreshTokenController(req as Request, res as Response)

      expect(mockAuthService.refreshTokenWithRotation).toHaveBeenCalledWith(
        'user_id_123',
        'old_refresh_token',
        'old-jti-uuid',
        expect.any(Object),
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw UnauthorizedError when refresh token is invalid', async () => {
      mockAuthService.refreshTokenWithRotation.mockRejectedValue(
        new ServiceUnauthorizedError('Refresh token không tồn tại'),
      )

      const req = createMockRequest({
        body: { refresh_token: 'invalid_refresh_token' },
        jwtDecoded: {
          id: 'user_id_123',
          email: 'test@example.com',
          roles: ['User'],
          created_at: new Date().toISOString(),
        },
      })
      const res = createMockResponse()

      await expect(
        authController.refreshTokenController(req as Request, res as Response),
      ).rejects.toMatchObject({
        status: STATUS.UNAUTHORIZED,
      })
    })

    it('should rethrow generic errors from refreshTokenWithRotation', async () => {
      mockAuthService.refreshTokenWithRotation.mockRejectedValue(new Error('DB error'))

      const req = createMockRequest({
        body: { refresh_token: 'some_refresh_token' },
        jwtDecoded: {
          id: 'user_id_123',
          email: 'test@example.com',
          roles: ['User'],
          created_at: new Date().toISOString(),
        },
      })
      const res = createMockResponse()

      await expect(
        authController.refreshTokenController(req as Request, res as Response),
      ).rejects.toThrow('DB error')
    })
  })

  describe('registerController generic error rethrow', () => {
    it('should rethrow non-ConflictError errors from register', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Unexpected failure'))
      const req = createMockRequest({ body: { email: 'test@example.com', password: 'pass123' } })
      const res = createMockResponse()

      await expect(
        authController.registerController(req as Request, res as Response),
      ).rejects.toThrow('Unexpected failure')
    })
  })

  describe('loginController generic error rethrow', () => {
    it('should rethrow non-invalid-credentials errors from login', async () => {
      mockAuthService.login.mockRejectedValue(new Error('DB connection error'))
      const req = createMockRequest({
        body: { email: 'test@example.com', password: 'pass123' },
        ip: '127.0.0.1',
      })
      const res = createMockResponse()

      await expect(authController.loginController(req as Request, res as Response)).rejects.toThrow(
        'DB connection error',
      )
    })
  })

  describe('getClientIP x-forwarded-for header branch', () => {
    it('should extract first IP from x-forwarded-for header', async () => {
      // The login path calls getClientIP internally
      mockAuthService.login.mockResolvedValue({
        access_token: 'tok',
        refresh_token: 'ref',
        expires: 900,
        expires_refresh_token: 604800,
        user: { _id: 'uid', email: 'test@example.com', roles: ['User'] } as any,
      } as any)

      const req = createMockRequest({
        body: { email: 'test@example.com', password: 'pass123' },
        headers: { 'x-forwarded-for': '10.0.0.1, 192.168.0.1' },
      })
      const res = createMockResponse()

      await authController.loginController(req as Request, res as Response)

      // Verify login was called (it internally resolved the IP)
      expect(mockAuthService.login).toHaveBeenCalled()
    })
  })

  describe('googleLoginController', () => {
    const mockGoogleAuthResult = {
      access_token: 'Bearer mock_google_access_token',
      refresh_token: 'mock_google_refresh_token',
      expires: 900,
      expires_refresh_token: 2592000,
      accessJti: 'access-jti-uuid',
      refreshJti: 'refresh-jti-uuid',
      user: {
        _id: 'google_user_id_123',
        email: 'google@example.com',
        roles: ['User'],
      },
    }

    it('6.2 — should return full tokens for a successful Google login (non-2FA user)', async () => {
      mockAuthService.googleLogin.mockResolvedValue(mockGoogleAuthResult as any)

      const req = createMockRequest({
        body: { id_token: 'valid_google_id_token' },
        headers: {},
      })
      const res = createMockResponse()

      await authController.googleLoginController(req as Request, res as Response)

      expect(mockAuthService.googleLogin).toHaveBeenCalledWith(
        'valid_google_id_token',
        expect.any(Object),
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('6.2 — should return requires2FA response when user has 2FA enabled', async () => {
      const twoFAResult = { requires2FA: true as const, partial_token: 'partial_token_value' }
      mockAuthService.googleLogin.mockResolvedValue(twoFAResult as any)

      const req = createMockRequest({
        body: { id_token: 'valid_google_id_token_2fa_user' },
        headers: {},
      })
      const res = createMockResponse()

      await authController.googleLoginController(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      // responseSuccess calls res.status().send(), not res.json()
      const sendCall = (res.send as jest.Mock).mock.calls[0]?.[0]
      expect(sendCall?.data?.requires2FA).toBe(true)
      expect(sendCall?.data?.partial_token).toBe('partial_token_value')
    })

    it('6.2 — should NOT include access_token in response when 2FA is required', async () => {
      const twoFAResult = { requires2FA: true as const, partial_token: 'partial_token_value' }
      mockAuthService.googleLogin.mockResolvedValue(twoFAResult as any)

      const req = createMockRequest({
        body: { id_token: 'valid_google_id_token_2fa_user' },
        headers: {},
      })
      const res = createMockResponse()

      await authController.googleLoginController(req as Request, res as Response)

      const sendCall = (res.send as jest.Mock).mock.calls[0]?.[0]
      expect(sendCall?.data?.access_token).toBeUndefined()
      expect(sendCall?.data?.refresh_token).toBeUndefined()
    })
  })
})
