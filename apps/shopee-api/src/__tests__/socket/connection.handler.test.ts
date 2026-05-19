/// <reference types="jest" />

const mockConsume = jest.fn()

jest.mock('rate-limiter-flexible', () => ({
  RateLimiterMemory: jest.fn().mockImplementation(() => ({
    consume: mockConsume,
    delete: jest.fn().mockResolvedValue(true),
  })),
  RateLimiterRedis: jest.fn().mockImplementation(() => ({
    consume: mockConsume,
    delete: jest.fn().mockResolvedValue(true),
  })),
  RateLimiterAbstract: jest.fn(),
}))

jest.mock('@utils/redis.client', () => ({
  redisClient: null,
}))

jest.mock('../../socket/managers/presence.manager', () => ({
  addUserSocket: jest.fn(),
  removeUserSocket: jest.fn(),
  getUserPresence: jest
    .fn()
    .mockReturnValue({ status: 'offline', lastSeen: '2024-01-01T00:00:00.000Z' }),
}))

jest.mock('../../socket/handlers/presence.handler', () => ({
  broadcastPresenceUpdate: jest.fn(),
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    sockets: { adapter: { rooms: new Map() } },
  }),
}))

jest.mock('../../utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiWarn: jest.fn(), apiError: jest.fn() },
}))

jest.mock('../../constants/socket', () => ({
  SOCKET_CONFIG: {
    RATE_LIMIT: { MAX_EVENTS_PER_SECOND: 10, WINDOW_MS: 1000 },
    ROOM_PREFIX: { CART: 'cart:', SELLER: 'seller:', PRODUCT: 'product:' },
  },
  SOCKET_ERRORS: { RATE_LIMITED: 'RATE_LIMITED', INTERNAL_ERROR: 'INTERNAL_ERROR' },
}))

jest.mock('../../constants/role.enum', () => ({
  ROLE: { ADMIN: 'Admin', USER: 'User' },
}))

import { createMockSocket } from './setup'
import {
  addUserSocket,
  removeUserSocket,
  getUserPresence,
} from '../../socket/managers/presence.manager'
import { broadcastPresenceUpdate } from '../../socket/handlers/presence.handler'
import {
  handleConnect,
  handleDisconnect,
  registerConnectionHandlers,
  createRateLimiter,
} from '../../socket/handlers/connection.handler'

describe('connection.handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: consume resolves (within rate limit)
    mockConsume.mockResolvedValue({ remainingPoints: 9 })
  })

  describe('handleConnect', () => {
    it('should add user socket and broadcast presence on connect', () => {
      const mockSocket = createMockSocket() as any

      handleConnect(mockSocket)

      expect(addUserSocket).toHaveBeenCalledWith('test-user-id', 'test-socket-id')
      expect(broadcastPresenceUpdate).toHaveBeenCalledWith(mockSocket, 'test-user-id', 'online')
      expect(mockSocket.join).toHaveBeenCalledWith('cart:test-user-id')
    })

    it('should join seller room if user is admin', () => {
      const mockSocket = createMockSocket({
        user: { id: 'admin-id', email: 'admin@test.com', roles: ['Admin'] },
      }) as any

      handleConnect(mockSocket)

      expect(mockSocket.join).toHaveBeenCalledWith('cart:admin-id')
      expect(mockSocket.join).toHaveBeenCalledWith('seller:admin-id')
    })

    it('should not add socket if user is not authenticated', () => {
      const mockSocket = createMockSocket({ user: undefined as any }) as any

      handleConnect(mockSocket)

      expect(addUserSocket).not.toHaveBeenCalled()
    })
  })

  describe('handleDisconnect', () => {
    it('should remove user socket and broadcast offline if user went fully offline', () => {
      const mockSocket = createMockSocket() as any
      ;(removeUserSocket as jest.Mock).mockReturnValue(true)

      handleDisconnect(mockSocket, 'client disconnect')

      expect(removeUserSocket).toHaveBeenCalledWith('test-user-id', 'test-socket-id')
      expect(getUserPresence).toHaveBeenCalledWith('test-user-id')
      expect(broadcastPresenceUpdate).toHaveBeenCalledWith(
        mockSocket,
        'test-user-id',
        'offline',
        '2024-01-01T00:00:00.000Z',
      )
    })

    it('should not broadcast offline if user still has other sockets', () => {
      const mockSocket = createMockSocket() as any
      ;(removeUserSocket as jest.Mock).mockReturnValue(false)

      handleDisconnect(mockSocket, 'client disconnect')

      expect(removeUserSocket).toHaveBeenCalledWith('test-user-id', 'test-socket-id')
      expect(broadcastPresenceUpdate).not.toHaveBeenCalled()
    })
  })

  describe('registerConnectionHandlers', () => {
    it('should register disconnect and error handlers', () => {
      const mockSocket = createMockSocket() as any

      registerConnectionHandlers(mockSocket)

      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function))
    })
  })

  describe('createRateLimiter', () => {
    it('should allow events within rate limit', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 9 })
      const mockSocket = createMockSocket() as any
      const rateLimiter = createRateLimiter(mockSocket)
      const callback = jest.fn()

      rateLimiter(callback)
      // Flush microtask queue so the .then() callback fires
      await Promise.resolve()

      expect(callback).toHaveBeenCalled()
      expect(mockSocket.emit).not.toHaveBeenCalled()
    })

    it('should block events exceeding rate limit', async () => {
      // First 10 calls resolve, remaining reject (rate limited)
      let callCount = 0
      mockConsume.mockImplementation(() => {
        callCount++
        if (callCount <= 10) {
          return Promise.resolve({ remainingPoints: 10 - callCount })
        }
        return Promise.reject(new Error('Rate limit exceeded'))
      })

      const mockSocket = createMockSocket({ id: 'rate-limit-test-socket' }) as any
      const rateLimiter = createRateLimiter(mockSocket)
      const callback = jest.fn()

      for (let i = 0; i < 15; i++) {
        rateLimiter(callback)
      }
      // Flush all pending microtasks
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(callback).toHaveBeenCalledTimes(10)
      expect(mockSocket.emit).toHaveBeenCalledWith('rate_limited', expect.any(Object))
    })
  })
})

