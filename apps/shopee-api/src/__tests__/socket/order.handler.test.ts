/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

import { Socket } from 'socket.io'
import { SocketEvent } from '../../@types/socket.type'
import { SOCKET_CONFIG, SOCKET_ERRORS } from '@constants/socket'
import { registerOrderHandlers, getOrderRoomName } from '../../socket/handlers/order.handler'

describe('Order Handler', () => {
  let mockSocket: jest.Mocked<Socket>
  let eventHandlers: Map<string, (...args: unknown[]) => unknown>

  beforeEach(() => {
    eventHandlers = new Map()

    mockSocket = {
      id: 'test-socket-id',
      user: { id: 'user-123', email: 'test@test.com', roles: ['User'] },
      on: jest.fn((event: string, handler: (...args: unknown[]) => unknown) => {
        eventHandlers.set(event, handler)
      }),
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
    } as unknown as jest.Mocked<Socket>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getOrderRoomName', () => {
    it('should return correct room name with order prefix', () => {
      const orderId = 'order-123'
      const roomName = getOrderRoomName(orderId)
      expect(roomName).toBe(`${SOCKET_CONFIG.ROOM_PREFIX.ORDER}${orderId}`)
    })
  })

  describe('registerOrderHandlers', () => {
    it('should register SUBSCRIBE_ORDER and UNSUBSCRIBE_ORDER listeners', () => {
      registerOrderHandlers(mockSocket)

      expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.SUBSCRIBE_ORDER, expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith(
        SocketEvent.UNSUBSCRIBE_ORDER,
        expect.any(Function),
      )
    })
  })

  describe('SUBSCRIBE_ORDER handler', () => {
    beforeEach(() => {
      registerOrderHandlers(mockSocket)
    })

    it('should join order room when valid order_id is provided', () => {
      const handler = eventHandlers.get(SocketEvent.SUBSCRIBE_ORDER)!
      const payload = { order_id: 'order-456' }

      handler(payload)

      const expectedRoom = `${SOCKET_CONFIG.ROOM_PREFIX.ORDER}order-456`
      expect(mockSocket.join).toHaveBeenCalledWith(expectedRoom)
    })

    it('should emit error when order_id is missing', () => {
      const handler = eventHandlers.get(SocketEvent.SUBSCRIBE_ORDER)!

      handler({})

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.INVALID_PAYLOAD,
        message: 'order_id is required',
      })
      expect(mockSocket.join).not.toHaveBeenCalled()
    })

    it('should emit error when payload is null', () => {
      const handler = eventHandlers.get(SocketEvent.SUBSCRIBE_ORDER)!

      handler(null)

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.INVALID_PAYLOAD,
        message: 'order_id is required',
      })
    })

    it('should emit error when payload is undefined', () => {
      const handler = eventHandlers.get(SocketEvent.SUBSCRIBE_ORDER)!

      handler(undefined)

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.INVALID_PAYLOAD,
        message: 'order_id is required',
      })
    })
  })

  describe('UNSUBSCRIBE_ORDER handler', () => {
    beforeEach(() => {
      registerOrderHandlers(mockSocket)
    })

    it('should leave order room when valid order_id is provided', () => {
      const handler = eventHandlers.get(SocketEvent.UNSUBSCRIBE_ORDER)!
      const payload = { order_id: 'order-789' }

      handler(payload)

      const expectedRoom = `${SOCKET_CONFIG.ROOM_PREFIX.ORDER}order-789`
      expect(mockSocket.leave).toHaveBeenCalledWith(expectedRoom)
    })

    it('should not leave room when order_id is missing', () => {
      const handler = eventHandlers.get(SocketEvent.UNSUBSCRIBE_ORDER)!

      handler({})

      expect(mockSocket.leave).not.toHaveBeenCalled()
    })

    it('should not leave room when payload is null', () => {
      const handler = eventHandlers.get(SocketEvent.UNSUBSCRIBE_ORDER)!

      handler(null)

      expect(mockSocket.leave).not.toHaveBeenCalled()
    })
  })
})
