/// <reference types="jest" />

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    sockets: { adapter: { rooms: new Map([['product:prod-123', new Set(['s1', 's2'])]]) } },
  }),
}))

jest.mock('../../socket/utils/activity-emit', () => ({
  emitActivityBuffer: jest.fn(),
}))

jest.mock('../../utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn() },
}))

jest.mock('../../constants/socket', () => ({
  SOCKET_CONFIG: { ROOM_PREFIX: { PRODUCT: 'product:', ADMIN: 'admin:' } },
  SOCKET_ERRORS: { INVALID_PAYLOAD: 'INVALID_PAYLOAD' },
}))

jest.mock('../../constants/role.enum', () => ({
  ROLE: { ADMIN: 'Admin', USER: 'User' },
}))

import { createMockSocket } from './setup'
import { emitActivityBuffer } from '../../socket/utils/activity-emit'
import {
  registerProductHandlers,
  joinAdminRoomIfAdmin,
  getProductRoomName,
  getAdminNotificationRoom,
} from '../../socket/handlers/product.handler'
import { SocketEvent } from '../../@types/socket.type'

describe('product.handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getProductRoomName', () => {
    it('should return correct room name', () => {
      expect(getProductRoomName('prod-123')).toBe('product:prod-123')
    })
  })

  describe('getAdminNotificationRoom', () => {
    it('should return admin notifications room name', () => {
      expect(getAdminNotificationRoom()).toBe('admin:notifications')
    })
  })

  describe('registerProductHandlers', () => {
    it('should register SUBSCRIBE_PRODUCT and UNSUBSCRIBE_PRODUCT listeners', () => {
      const mockSocket = createMockSocket() as any

      registerProductHandlers(mockSocket)

      expect(mockSocket.on).toHaveBeenCalledWith(
        SocketEvent.SUBSCRIBE_PRODUCT,
        expect.any(Function),
      )
      expect(mockSocket.on).toHaveBeenCalledWith(
        SocketEvent.UNSUBSCRIBE_PRODUCT,
        expect.any(Function),
      )
    })
  })

  describe('SUBSCRIBE_PRODUCT event', () => {
    it('should join product room and emit activity buffer', async () => {
      const mockSocket = createMockSocket() as any

      registerProductHandlers(mockSocket)
      const subscribeHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.SUBSCRIBE_PRODUCT,
      )[1]
      subscribeHandler({ product_id: 'prod-123' })

      expect(mockSocket.join).toHaveBeenCalledWith('product:prod-123')
      expect(emitActivityBuffer).toHaveBeenCalledWith('test-socket-id', 'prod-123')
    })

    it('should emit error when product_id is missing', () => {
      const mockSocket = createMockSocket() as any

      registerProductHandlers(mockSocket)
      const subscribeHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.SUBSCRIBE_PRODUCT,
      )[1]
      subscribeHandler({})

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SocketEvent.ERROR,
        expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
      )
      expect(mockSocket.join).not.toHaveBeenCalled()
    })
  })

  describe('UNSUBSCRIBE_PRODUCT event', () => {
    it('should leave product room', () => {
      const mockSocket = createMockSocket() as any

      registerProductHandlers(mockSocket)
      const unsubscribeHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.UNSUBSCRIBE_PRODUCT,
      )[1]
      unsubscribeHandler({ product_id: 'prod-123' })

      expect(mockSocket.leave).toHaveBeenCalledWith('product:prod-123')
    })

    it('should do nothing when product_id is missing', () => {
      const mockSocket = createMockSocket() as any

      registerProductHandlers(mockSocket)
      const unsubscribeHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.UNSUBSCRIBE_PRODUCT,
      )[1]
      unsubscribeHandler({})

      expect(mockSocket.leave).not.toHaveBeenCalled()
    })
  })

  describe('joinAdminRoomIfAdmin', () => {
    it('should join admin room when user has Admin role', () => {
      const mockSocket = createMockSocket({
        user: { id: 'admin-id', email: 'admin@test.com', roles: ['Admin'] },
      }) as any

      joinAdminRoomIfAdmin(mockSocket)

      expect(mockSocket.join).toHaveBeenCalledWith('admin:notifications')
    })

    it('should not join admin room when user is not admin', () => {
      const mockSocket = createMockSocket({
        user: { id: 'user-id', email: 'user@test.com', roles: ['User'] },
      }) as any

      joinAdminRoomIfAdmin(mockSocket)

      expect(mockSocket.join).not.toHaveBeenCalled()
    })

    it('should not join admin room when user has no roles', () => {
      const mockSocket = createMockSocket({
        user: { id: 'user-id', email: 'user@test.com', roles: [] },
      }) as any

      joinAdminRoomIfAdmin(mockSocket)

      expect(mockSocket.join).not.toHaveBeenCalled()
    })
  })
})
