/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

import { getIORequired } from '../../socket/socket.init'
import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent } from '../../@types/socket.type'
import {
  getChatRoomName,
  getUserRoomName,
  getProductRoomName,
  joinChatRoom,
  leaveChatRoom,
  leaveAllChatRooms,
  leaveAllProductRooms,
} from '../../socket/utils/rooms'

const mockGetIORequired = getIORequired as jest.Mock

const createMockSocket = (overrides: Partial<any> = {}) => ({
  id: 'socket-123',
  user: { id: 'user-456', email: 'test@example.com' },
  join: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
  to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  rooms: new Set(['socket-123']),
  ...overrides,
})

describe('rooms.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getChatRoomName', () => {
    it('returns correct format', () => {
      const result = getChatRoomName('abc123')
      expect(result).toBe(`${SOCKET_CONFIG.ROOM_PREFIX.CHAT}abc123`)
    })
  })

  describe('getUserRoomName', () => {
    it('returns correct format', () => {
      const result = getUserRoomName('user-789')
      expect(result).toBe(`${SOCKET_CONFIG.ROOM_PREFIX.USER}user-789`)
    })
  })

  describe('getProductRoomName', () => {
    it('returns correct format', () => {
      const result = getProductRoomName('prod-001')
      expect(result).toBe(`${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}prod-001`)
    })
  })

  describe('joinChatRoom', () => {
    it('joins room and emits USER_JOINED', async () => {
      const mockSocket = createMockSocket()
      const chatId = 'chat-001'

      await joinChatRoom(mockSocket as any, chatId)

      const expectedRoom = `${SOCKET_CONFIG.ROOM_PREFIX.CHAT}${chatId}`
      expect(mockSocket.join).toHaveBeenCalledWith(expectedRoom)
      expect(mockSocket.to).toHaveBeenCalledWith(expectedRoom)
      expect(mockSocket.to(expectedRoom).emit).toHaveBeenCalledWith(SocketEvent.USER_JOINED, {
        chat_id: chatId,
        user_id: mockSocket.user.id,
        user_name: mockSocket.user.email,
      })
    })

    it('handles error gracefully', async () => {
      const mockSocket = createMockSocket({
        join: jest.fn().mockRejectedValue(new Error('Join failed')),
      })

      await expect(joinChatRoom(mockSocket as any, 'chat-001')).resolves.not.toThrow()
    })
  })

  describe('leaveChatRoom', () => {
    it('emits USER_LEFT and leaves room', async () => {
      const mockSocket = createMockSocket()
      const chatId = 'chat-002'

      await leaveChatRoom(mockSocket as any, chatId)

      const expectedRoom = `${SOCKET_CONFIG.ROOM_PREFIX.CHAT}${chatId}`
      expect(mockSocket.to).toHaveBeenCalledWith(expectedRoom)
      expect(mockSocket.to(expectedRoom).emit).toHaveBeenCalledWith(SocketEvent.USER_LEFT, {
        chat_id: chatId,
        user_id: mockSocket.user.id,
        user_name: mockSocket.user.email,
      })
      expect(mockSocket.leave).toHaveBeenCalledWith(expectedRoom)
    })
  })

  describe('leaveAllChatRooms', () => {
    it('leaves only chat rooms', async () => {
      const mockSocket = createMockSocket({
        rooms: new Set([
          'socket-123',
          `${SOCKET_CONFIG.ROOM_PREFIX.CHAT}chat-001`,
          `${SOCKET_CONFIG.ROOM_PREFIX.CHAT}chat-002`,
          `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}prod-001`,
        ]),
      })

      await leaveAllChatRooms(mockSocket as any)

      expect(mockSocket.leave).toHaveBeenCalledTimes(2)
      expect(mockSocket.leave).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.CHAT}chat-001`)
      expect(mockSocket.leave).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.CHAT}chat-002`)
    })
  })

  describe('getRoomMembers', () => {
    it('returns socket IDs', async () => {
      jest.resetModules()
      jest.doMock('@utils/logger', () => ({
        Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
      }))
      const mockFetchSockets = jest.fn().mockResolvedValue([{ id: 's1' }, { id: 's2' }])
      jest.doMock('../../socket/socket.init', () => ({
        getIORequired: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({ fetchSockets: mockFetchSockets }),
        }),
      }))

      const { getRoomMembers } = await import('../../socket/utils/rooms')
      const result = await getRoomMembers('test-room')

      expect(result).toEqual(['s1', 's2'])
    })

    it('returns empty array on error', async () => {
      jest.resetModules()
      jest.doMock('@utils/logger', () => ({
        Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
      }))
      jest.doMock('../../socket/socket.init', () => ({
        getIORequired: jest.fn().mockImplementation(() => {
          throw new Error('IO not initialized')
        }),
      }))

      const { getRoomMembers } = await import('../../socket/utils/rooms')
      const result = await getRoomMembers('test-room')

      expect(result).toEqual([])
    })
  })

  describe('isUserInRoom', () => {
    it('returns true when user found', async () => {
      jest.resetModules()
      jest.doMock('@utils/logger', () => ({
        Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
      }))
      const mockFetchSockets = jest.fn().mockResolvedValue([
        { id: 's1', data: { user: { id: 'user-123' } } },
        { id: 's2', data: { user: { id: 'user-456' } } },
      ])
      jest.doMock('../../socket/socket.init', () => ({
        getIORequired: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({ fetchSockets: mockFetchSockets }),
        }),
      }))

      const { isUserInRoom } = await import('../../socket/utils/rooms')
      const result = await isUserInRoom('user-123', 'test-room')

      expect(result).toBe(true)
    })

    it('returns false when user not found', async () => {
      jest.resetModules()
      jest.doMock('@utils/logger', () => ({
        Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
      }))
      const mockFetchSockets = jest.fn().mockResolvedValue([
        { id: 's1', data: { user: { id: 'user-999' } } },
      ])
      jest.doMock('../../socket/socket.init', () => ({
        getIORequired: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({ fetchSockets: mockFetchSockets }),
        }),
      }))

      const { isUserInRoom } = await import('../../socket/utils/rooms')
      const result = await isUserInRoom('user-123', 'test-room')

      expect(result).toBe(false)
    })
  })

  describe('leaveAllProductRooms', () => {
    it('leaves only product rooms', async () => {
      const mockSocket = createMockSocket({
        rooms: new Set([
          'socket-123',
          `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}prod-001`,
          `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}prod-002`,
          `${SOCKET_CONFIG.ROOM_PREFIX.CHAT}chat-001`,
        ]),
      })

      await leaveAllProductRooms(mockSocket as any)

      expect(mockSocket.leave).toHaveBeenCalledTimes(2)
      expect(mockSocket.leave).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}prod-001`)
      expect(mockSocket.leave).toHaveBeenCalledWith(`${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}prod-002`)
    })
  })
})

