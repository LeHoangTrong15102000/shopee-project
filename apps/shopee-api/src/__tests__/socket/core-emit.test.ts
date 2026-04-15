/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent } from '../../@types/socket.type'

describe('Core Emit Utils', () => {
  let mockIO: any
  let mockEmit: jest.Mock
  let mockExcept: jest.Mock

  const setupMockIO = () => {
    mockEmit = jest.fn()
    mockExcept = jest.fn().mockReturnValue({ emit: mockEmit })
    mockIO = {
      to: jest.fn().mockReturnValue({
        emit: mockEmit,
        except: mockExcept,
      }),
    }
  }

  /** Re-acquire getIORequired mock from the freshly imported module after resetModules */
  const setupMock = async (throwError = false) => {
    jest.resetModules()
    setupMockIO()
    const { getIORequired } = await import('../../socket/socket.init')
    if (throwError) {
      ;(getIORequired as jest.Mock).mockImplementation(() => {
        throw new Error('IO not initialized')
      })
    } else {
      ;(getIORequired as jest.Mock).mockReturnValue(mockIO)
    }
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('emitToUser', () => {
    it('should emit to correct user room and return true', async () => {
      await setupMock()
      const { emitToUser } = await import('../../socket/utils/emit')
      const result = emitToUser('user-123', 'test-event', { data: 'test' })

      expect(result).toBe(true)
      expect(mockIO.to).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.USER}user-123`)
      expect(mockEmit).toHaveBeenCalledWith('test-event', { data: 'test' })
    })

    it('should return false when getIORequired throws', async () => {
      await setupMock(true)
      const { emitToUser } = await import('../../socket/utils/emit')
      const result = emitToUser('user-123', 'test-event', { data: 'test' })

      expect(result).toBe(false)
    })
  })

  describe('emitToUsers', () => {
    it('should emit to all user rooms', async () => {
      await setupMock()
      const { emitToUsers } = await import('../../socket/utils/emit')
      emitToUsers(['user-1', 'user-2', 'user-3'], 'test-event', { data: 'test' })

      expect(mockIO.to).toHaveBeenCalledTimes(3)
      expect(mockIO.to).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.USER}user-1`)
      expect(mockIO.to).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.USER}user-2`)
      expect(mockIO.to).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.USER}user-3`)
    })

    it('should handle error gracefully', async () => {
      await setupMock(true)
      const { emitToUsers } = await import('../../socket/utils/emit')

      expect(() => emitToUsers(['user-1'], 'test-event', {})).not.toThrow()
    })
  })

  describe('emitToChat', () => {
    it('should emit to correct chat room', async () => {
      await setupMock()
      const { emitToChat } = await import('../../socket/utils/emit')
      emitToChat('chat-456', 'message', { text: 'hello' })

      expect(mockIO.to).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.CHAT}chat-456`)
      expect(mockEmit).toHaveBeenCalledWith('message', { text: 'hello' })
    })
  })

  describe('emitToChatExcludeSender', () => {
    it('should use except() to exclude sender socket', async () => {
      await setupMock()
      const { emitToChatExcludeSender } = await import('../../socket/utils/emit')
      emitToChatExcludeSender('chat-789', 'sender-socket-id', 'message', { text: 'hi' })

      expect(mockIO.to).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.CHAT}chat-789`)
      expect(mockExcept).toHaveBeenCalledWith('sender-socket-id')
      expect(mockEmit).toHaveBeenCalledWith('message', { text: 'hi' })
    })
  })

  describe('emitNotification', () => {
    it('should emit NOTIFICATION event and return true', async () => {
      await setupMock()
      const { emitNotification } = await import('../../socket/utils/emit')
      const notification = { _id: 'notif-1', type: 'order', message: 'Order shipped' }
      const result = emitNotification('user-123', notification as any)

      expect(result).toBe(true)
      expect(mockIO.to).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.USER}user-123`)
      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.NOTIFICATION, notification)
    })

    it('should return false on error', async () => {
      await setupMock(true)
      const { emitNotification } = await import('../../socket/utils/emit')
      const result = emitNotification('user-123', {} as any)

      expect(result).toBe(false)
    })
  })

  describe('emitError', () => {
    it('should emit ERROR event to socket', async () => {
      await setupMock()
      const { emitError } = await import('../../socket/utils/emit')
      const error = { code: 'INVALID_TOKEN', message: 'Token expired' }
      emitError('socket-id-123', error)

      expect(mockIO.to).toHaveBeenCalledWith('socket-id-123')
      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.ERROR, error)
    })
  })
})
