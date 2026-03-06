/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
}))

import { createMockSocket, MockSocket } from './setup'
import { SocketEvent } from '../../@types/socket.type'
import { SOCKET_CONFIG, SOCKET_ERRORS } from '@constants/socket'
import { getFlashSaleRoomName, registerFlashSaleHandlers } from '../../socket/handlers/flash-sale.handler'

describe('Flash Sale Handler', () => {
  let mockSocket: MockSocket

  beforeEach(() => {
    mockSocket = createMockSocket()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const getHandler = (eventName: string) => {
    const call = mockSocket.on.mock.calls.find(([event]) => event === eventName)
    return call ? call[1] : undefined
  }

  describe('getFlashSaleRoomName', () => {
    it('should return correct format flash_sale:{saleId}', () => {
      const saleId = 'sale-123'
      const roomName = getFlashSaleRoomName(saleId)
      expect(roomName).toBe(`${SOCKET_CONFIG.ROOM_PREFIX.FLASH_SALE}${saleId}`)
    })
  })

  describe('registerFlashSaleHandlers', () => {
    it('should register SUBSCRIBE_FLASH_SALE and UNSUBSCRIBE_FLASH_SALE handlers', () => {
      registerFlashSaleHandlers(mockSocket as any)

      expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.SUBSCRIBE_FLASH_SALE, expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.UNSUBSCRIBE_FLASH_SALE, expect.any(Function))
    })
  })

  describe('SUBSCRIBE_FLASH_SALE handler', () => {
    beforeEach(() => {
      registerFlashSaleHandlers(mockSocket as any)
    })

    it('should join flash sale room with valid payload', () => {
      const handler = getHandler(SocketEvent.SUBSCRIBE_FLASH_SALE)!
      const payload = { sale_id: 'sale-456' }

      handler(payload)

      const expectedRoom = `${SOCKET_CONFIG.ROOM_PREFIX.FLASH_SALE}sale-456`
      expect(mockSocket.join).toHaveBeenCalledWith(expectedRoom)
    })

    it('should emit ERROR when payload missing sale_id', () => {
      const handler = getHandler(SocketEvent.SUBSCRIBE_FLASH_SALE)!

      handler({})

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.INVALID_PAYLOAD,
        message: 'sale_id is required',
      })
      expect(mockSocket.join).not.toHaveBeenCalled()
    })

    it('should emit ERROR when payload is null', () => {
      const handler = getHandler(SocketEvent.SUBSCRIBE_FLASH_SALE)!

      handler(null)

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.INVALID_PAYLOAD,
        message: 'sale_id is required',
      })
    })

    it('should emit ERROR when payload is undefined', () => {
      const handler = getHandler(SocketEvent.SUBSCRIBE_FLASH_SALE)!

      handler(undefined)

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.INVALID_PAYLOAD,
        message: 'sale_id is required',
      })
    })
  })

  describe('UNSUBSCRIBE_FLASH_SALE handler', () => {
    beforeEach(() => {
      registerFlashSaleHandlers(mockSocket as any)
    })

    it('should leave flash sale room with valid payload', () => {
      const handler = getHandler(SocketEvent.UNSUBSCRIBE_FLASH_SALE)!
      const payload = { sale_id: 'sale-789' }

      handler(payload)

      const expectedRoom = `${SOCKET_CONFIG.ROOM_PREFIX.FLASH_SALE}sale-789`
      expect(mockSocket.leave).toHaveBeenCalledWith(expectedRoom)
    })

    it('should return early when payload missing sale_id (no error emitted)', () => {
      const handler = getHandler(SocketEvent.UNSUBSCRIBE_FLASH_SALE)!

      handler({})

      expect(mockSocket.leave).not.toHaveBeenCalled()
      expect(mockSocket.emit).not.toHaveBeenCalled()
    })
  })
})

