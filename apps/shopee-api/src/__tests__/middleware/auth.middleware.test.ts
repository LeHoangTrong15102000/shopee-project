/**
 * Unit Tests cho Auth Middleware
 * Test chức năng xác thực access token (pure JWT verification)
 */

/// <reference types="jest" />
import { Request, Response, NextFunction } from 'express'
import { STATUS } from '@constants/status'
import authMiddleware from '@middleware/auth.middleware'
import { verifyToken } from '@utils/jwt'

// Mock verifyToken (setup.ts doesn't mock this)
jest.mock('@utils/jwt', () => ({
  verifyToken: jest.fn(),
}))

// Mock UserModel for verifyAdmin tests
jest.mock('@database/models/user.model', () => ({
  UserModel: {
    findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
  },
}))

import { UserModel } from '@database/models/user.model'

// Interface cho mock request options
interface MockRequestOptions {
  body?: Record<string, unknown>
  params?: Record<string, string>
  query?: Record<string, string>
  headers?: Record<string, string>
  jwtDecoded?: {
    id: string
    email: string
    roles: string[]
    created_at: string
  }
}

// Helper functions để tạo mock request/response/next
const createMockRequest = (options: MockRequestOptions = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  jwtDecoded: options.jwtDecoded,
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const createMockNext = (): NextFunction => jest.fn()

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyAccessToken', () => {
    // Test: Cho phép request với token hợp lệ (pure JWT verification)
    it('should pass with valid JWT token', async () => {
      const validToken = 'valid_access_token'
      const decodedPayload = {
        id: 'user_id_123',
        email: 'test@example.com',
        roles: ['User'],
        created_at: new Date().toISOString(),
      }

      // Mock verifyToken trả về payload hợp lệ
      ;(verifyToken as jest.Mock).mockResolvedValue(decodedPayload)

      const req = createMockRequest({
        headers: { authorization: `Bearer ${validToken}` },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAccessToken(req as Request, res as Response, next)

      // Verify next() được gọi (request được cho phép tiếp tục)
      expect(next).toHaveBeenCalled()
      // Verify jwtDecoded được set vào request
      expect(req.jwtDecoded).toEqual(decodedPayload)
      // Verify verifyToken được gọi với token
      expect(verifyToken).toHaveBeenCalledWith(validToken, expect.any(String))
    })

    // Test: Từ chối request với token không hợp lệ
    it('should fail with invalid token', async () => {
      const invalidToken = 'invalid_token'

      // Mock verifyToken throw error (token không hợp lệ)
      ;(verifyToken as jest.Mock).mockRejectedValue(new Error('Token không đúng'))

      const req = createMockRequest({
        headers: { authorization: `Bearer ${invalidToken}` },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAccessToken(req as Request, res as Response, next)

      // Verify next() không được gọi
      expect(next).not.toHaveBeenCalled()
      // Verify response trả về lỗi
      expect(res.status).toHaveBeenCalled()
      expect(res.send).toHaveBeenCalled()
    })

    // Test: Từ chối token với chữ ký bị giả mạo
    it('should reject tampered token with invalid signature', async () => {
      const tamperedToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfMTIzIn0.TAMPERED_SIGNATURE'

      // Mock verifyToken throw error (chữ ký không hợp lệ)
      ;(verifyToken as jest.Mock).mockRejectedValue(new Error('invalid signature'))

      const req = createMockRequest({
        headers: { authorization: `Bearer ${tamperedToken}` },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAccessToken(req as Request, res as Response, next)

      // Verify next() không được gọi
      expect(next).not.toHaveBeenCalled()
      // Verify response trả về lỗi
      expect(res.status).toHaveBeenCalled()
      expect(res.send).toHaveBeenCalled()
    })

    // Test: Từ chối request khi không có token
    it('should fail without token', async () => {
      const req = createMockRequest({
        headers: {}, // Không có authorization header
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAccessToken(req as Request, res as Response, next)

      // Verify next() không được gọi
      expect(next).not.toHaveBeenCalled()
      // Verify response trả về lỗi UNAUTHORIZED
      expect(res.status).toHaveBeenCalledWith(STATUS.UNAUTHORIZED)
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token không được gửi',
        }),
      )
    })

    // Test: Từ chối khi token hết hạn
    it('should fail when token is expired', async () => {
      const expiredToken = 'expired_token'

      // Mock verifyToken throw error (token hết hạn)
      ;(verifyToken as jest.Mock).mockRejectedValue(new Error('EXPIRED_TOKEN'))

      const req = createMockRequest({
        headers: { authorization: `Bearer ${expiredToken}` },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAccessToken(req as Request, res as Response, next)

      // Verify next() không được gọi
      expect(next).not.toHaveBeenCalled()
      // Verify response trả về lỗi
      expect(res.status).toHaveBeenCalled()
      expect(res.send).toHaveBeenCalled()
    })
  })

  describe('verifyAccessTokenOptional', () => {
    // Test: Cho phép request với token hợp lệ
    it('should pass and set jwtDecoded with valid token', async () => {
      const validToken = 'valid_access_token'
      const decodedPayload = {
        id: 'user_id_123',
        email: 'test@example.com',
        roles: ['User'],
        created_at: new Date().toISOString(),
      }

      ;(verifyToken as jest.Mock).mockResolvedValue(decodedPayload)

      const req = createMockRequest({
        headers: { authorization: `Bearer ${validToken}` },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAccessTokenOptional(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(req.jwtDecoded).toEqual(decodedPayload)
    })

    // Test: Cho phép request không có token (optional)
    it('should pass without token and set jwtDecoded to undefined', async () => {
      const req = createMockRequest({
        headers: {},
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAccessTokenOptional(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(req.jwtDecoded).toBeUndefined()
    })

    // Test: Cho phép request với token không hợp lệ (graceful fallback)
    it('should pass with invalid token and set jwtDecoded to undefined', async () => {
      const invalidToken = 'invalid_token'

      ;(verifyToken as jest.Mock).mockRejectedValue(new Error('Token không đúng'))

      const req = createMockRequest({
        headers: { authorization: `Bearer ${invalidToken}` },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAccessTokenOptional(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(req.jwtDecoded).toBeUndefined()
    })
  })

  // =================== Task 6.4: verifyAdmin tests ===================

  describe('verifyAdmin', () => {
    it('6.4 — should NOT call UserModel.findById when roles present in JWT and includes Admin', async () => {
      const req = createMockRequest({
        jwtDecoded: {
          id: 'admin_user_id',
          email: 'admin@example.com',
          roles: ['Admin'],
          created_at: new Date().toISOString(),
        },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAdmin(req as Request, res as Response, next)

      // Admin should proceed without DB call
      expect(next).toHaveBeenCalled()
      expect(UserModel.findById).not.toHaveBeenCalled()
    })

    it('should deny access when roles present but does not include Admin', async () => {
      const req = createMockRequest({
        jwtDecoded: {
          id: 'regular_user_id',
          email: 'user@example.com',
          roles: ['User'],
          created_at: new Date().toISOString(),
        },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAdmin(req as Request, res as Response, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should fall back to DB lookup when roles array is empty (legacy token)', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ roles: ['Admin'] }),
      })

      const req = createMockRequest({
        jwtDecoded: {
          id: 'legacy_user_id',
          email: 'legacy@example.com',
          roles: [], // empty — legacy token
          created_at: new Date().toISOString(),
        },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAdmin(req as Request, res as Response, next)

      // DB lookup should have happened as fallback
      expect(UserModel.findById).toHaveBeenCalledWith('legacy_user_id')
      expect(next).toHaveBeenCalled()
    })

    it('should perform DB lookup when requireFreshRoleCheck flag is set', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ roles: ['Admin'] }),
      })

      const req = createMockRequest({
        jwtDecoded: {
          id: 'admin_user_id',
          email: 'admin@example.com',
          roles: ['Admin'], // roles present, but fresh check required
          created_at: new Date().toISOString(),
        },
      }) as any
      req.requireFreshRoleCheck = true

      const res = createMockResponse()
      const next = createMockNext()

      await authMiddleware.verifyAdmin(req as Request, res as Response, next)

      expect(UserModel.findById).toHaveBeenCalledWith('admin_user_id')
      expect(next).toHaveBeenCalled()
    })
  })
})
