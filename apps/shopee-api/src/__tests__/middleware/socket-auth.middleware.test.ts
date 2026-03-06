/// <reference types="jest" />

jest.mock('../../constants/config', () => ({
  config: { SECRET_KEY: 'test-secret' },
}))

jest.mock('../../utils/jwt', () => ({
  verifyToken: jest.fn(),
}))

jest.mock('../../database/models/access-token.model', () => ({
  AccessTokenModel: {
    findOne: jest.fn().mockReturnValue({ exec: jest.fn() }),
  },
}))

jest.mock('../../constants/socket', () => ({
  SOCKET_ERRORS: {
    AUTH_ERROR: 'AUTH_ERROR',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  },
}))

jest.mock('../../utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiWarn: jest.fn(),
    apiError: jest.fn(),
  },
}))

import { verifyToken } from '../../utils/jwt'
import { AccessTokenModel } from '../../database/models/access-token.model'
import { socketAuthMiddleware } from '../../middleware/socket-auth.middleware'

const createMockSocket = (token?: string): any => ({
  id: 'socket-123',
  handshake: { auth: { token } },
  user: undefined as any,
})

describe('socketAuthMiddleware', () => {
  const mockNext = jest.fn()
  const mockDecodedToken = {
    id: 'user-123',
    email: 'test@example.com',
    roles: ['user'],
    created_at: '2024-01-01',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should authenticate successfully with valid token', async () => {
    const mockSocket = createMockSocket('valid-token')
    ;(verifyToken as jest.Mock).mockResolvedValue(mockDecodedToken)
    ;(AccessTokenModel.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ token: 'valid-token' }),
    })

    await socketAuthMiddleware(mockSocket, mockNext)

    expect(verifyToken).toHaveBeenCalledWith('valid-token', 'test-secret')
    expect(AccessTokenModel.findOne).toHaveBeenCalledWith({ token: 'valid-token' })
    expect(mockSocket.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      roles: ['user'],
    })
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should reject connection when token is missing', async () => {
    const mockSocket = createMockSocket(undefined)

    await socketAuthMiddleware(mockSocket, mockNext)

    expect(verifyToken).not.toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(new Error('AUTH_ERROR'))
  })

  it('should reject connection when token is invalid', async () => {
    const mockSocket = createMockSocket('invalid-token')
    ;(verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'))

    await socketAuthMiddleware(mockSocket, mockNext)

    expect(verifyToken).toHaveBeenCalledWith('invalid-token', 'test-secret')
    expect(mockNext).toHaveBeenCalledWith(new Error('AUTH_ERROR'))
  })

  it('should reject connection when token is not found in database', async () => {
    const mockSocket = createMockSocket('valid-token')
    ;(verifyToken as jest.Mock).mockResolvedValue(mockDecodedToken)
    ;(AccessTokenModel.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    await socketAuthMiddleware(mockSocket, mockNext)

    expect(verifyToken).toHaveBeenCalledWith('valid-token', 'test-secret')
    expect(AccessTokenModel.findOne).toHaveBeenCalledWith({ token: 'valid-token' })
    expect(mockSocket.user).toBeUndefined()
    expect(mockNext).toHaveBeenCalledWith(new Error('AUTH_ERROR'))
  })

  it('should reject connection with TOKEN_EXPIRED when token is expired', async () => {
    const mockSocket = createMockSocket('expired-token')
    const expiredError = { message: { name: 'EXPIRED_TOKEN' } }
    ;(verifyToken as jest.Mock).mockRejectedValue(expiredError)

    await socketAuthMiddleware(mockSocket, mockNext)

    expect(verifyToken).toHaveBeenCalledWith('expired-token', 'test-secret')
    expect(mockNext).toHaveBeenCalledWith(new Error('TOKEN_EXPIRED'))
  })
})

