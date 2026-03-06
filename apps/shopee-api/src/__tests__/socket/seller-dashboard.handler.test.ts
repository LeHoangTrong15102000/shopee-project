/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
}))

import { createMockSocket, MockSocket } from './setup'
import {
  getSellerRoomName,
  registerSellerDashboardHandlers,
} from '../../socket/handlers/seller-dashboard.handler'
import { SocketEvent } from '../../@types/socket.type'
import { SOCKET_ERRORS } from '@constants/socket'

describe('seller-dashboard.handler', () => {
  let mockSocket: MockSocket

  const getHandler = (eventName: string) => {
    const call = mockSocket.on.mock.calls.find(([event]) => event === eventName)
    return call ? call[1] : undefined
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSocket = createMockSocket({
      user: { id: 'admin-1', email: 'admin@test.com', roles: ['Admin'] },
    })
  })

  describe('getSellerRoomName', () => {
    it('returns correct format seller:{userId}', () => {
      const result = getSellerRoomName('user-123')
      expect(result).toBe('seller:user-123')
    })
  })

  describe('registerSellerDashboardHandlers', () => {
    it('registers both event handlers', () => {
      registerSellerDashboardHandlers(mockSocket as any)

      expect(mockSocket.on).toHaveBeenCalledTimes(2)
      expect(mockSocket.on).toHaveBeenCalledWith(
        SocketEvent.SUBSCRIBE_SELLER_DASHBOARD,
        expect.any(Function)
      )
      expect(mockSocket.on).toHaveBeenCalledWith(
        SocketEvent.UNSUBSCRIBE_SELLER_DASHBOARD,
        expect.any(Function)
      )
    })
  })

  describe('SUBSCRIBE_SELLER_DASHBOARD', () => {
    it('joins seller room when user is Admin', () => {
      registerSellerDashboardHandlers(mockSocket as any)
      const handler = getHandler(SocketEvent.SUBSCRIBE_SELLER_DASHBOARD)

      handler()

      expect(mockSocket.join).toHaveBeenCalledWith('seller:admin-1')
      expect(mockSocket.emit).not.toHaveBeenCalledWith(
        SocketEvent.ERROR,
        expect.anything()
      )
    })

    it('emits ERROR when user is not Admin (roles=[User])', () => {
      mockSocket = createMockSocket({
        user: { id: 'user-1', email: 'user@test.com', roles: ['User'] },
      })
      registerSellerDashboardHandlers(mockSocket as any)
      const handler = getHandler(SocketEvent.SUBSCRIBE_SELLER_DASHBOARD)

      handler()

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.UNAUTHORIZED,
        message: 'Only Admin users can subscribe to seller dashboard',
      })
      expect(mockSocket.join).not.toHaveBeenCalled()
    })

    it('emits ERROR when user has no roles (roles=[])', () => {
      mockSocket = createMockSocket({
        user: { id: 'user-1', email: 'user@test.com', roles: [] },
      })
      registerSellerDashboardHandlers(mockSocket as any)
      const handler = getHandler(SocketEvent.SUBSCRIBE_SELLER_DASHBOARD)

      handler()

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.UNAUTHORIZED,
        message: 'Only Admin users can subscribe to seller dashboard',
      })
      expect(mockSocket.join).not.toHaveBeenCalled()
    })

    it('returns early when no userId', () => {
      mockSocket = createMockSocket({
        user: { id: '', email: '', roles: ['Admin'] },
      })
      registerSellerDashboardHandlers(mockSocket as any)
      const handler = getHandler(SocketEvent.SUBSCRIBE_SELLER_DASHBOARD)

      handler()

      expect(mockSocket.join).not.toHaveBeenCalled()
    })
  })

  describe('UNSUBSCRIBE_SELLER_DASHBOARD', () => {
    it('leaves seller room', () => {
      registerSellerDashboardHandlers(mockSocket as any)
      const handler = getHandler(SocketEvent.UNSUBSCRIBE_SELLER_DASHBOARD)

      handler()

      expect(mockSocket.leave).toHaveBeenCalledWith('seller:admin-1')
    })

    it('returns early when no userId', () => {
      mockSocket = createMockSocket({
        user: { id: '', email: '', roles: [] },
      })
      registerSellerDashboardHandlers(mockSocket as any)
      const handler = getHandler(SocketEvent.UNSUBSCRIBE_SELLER_DASHBOARD)

      handler()

      expect(mockSocket.leave).not.toHaveBeenCalled()
    })
  })
})

