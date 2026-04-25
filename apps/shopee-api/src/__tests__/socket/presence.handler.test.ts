/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

jest.mock('../../socket/managers/presence.manager', () => ({
  getUserPresence: jest.fn(),
}))

import { Socket } from 'socket.io'
import { SocketEvent } from '../../@types/socket.type'
import { SOCKET_ERRORS } from '@constants/socket'
import {
  registerPresenceHandlers,
  broadcastPresenceUpdate,
} from '../../socket/handlers/presence.handler'
import { getUserPresence } from '../../socket/managers/presence.manager'

describe('Presence Handler', () => {
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
      broadcast: {
        emit: jest.fn(),
      },
    } as unknown as jest.Mocked<Socket>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('registerPresenceHandlers', () => {
    it('should register GET_PRESENCE listener', () => {
      registerPresenceHandlers(mockSocket)

      expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.GET_PRESENCE, expect.any(Function))
    })
  })

  describe('GET_PRESENCE handler', () => {
    beforeEach(() => {
      registerPresenceHandlers(mockSocket)
    })

    it('should emit PRESENCE_STATUS when valid user_id is provided and user is online', () => {
      const mockPresence = { status: 'online' as const, lastSeen: null }
      ;(getUserPresence as jest.Mock).mockReturnValue(mockPresence)

      const handler = eventHandlers.get(SocketEvent.GET_PRESENCE)!
      const payload = { user_id: 'target-user-456' }

      handler(payload)

      expect(getUserPresence).toHaveBeenCalledWith('target-user-456')
      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.PRESENCE_STATUS, {
        user_id: 'target-user-456',
        status: 'online',
        last_seen: null,
      })
    })

    it('should emit PRESENCE_STATUS when valid user_id is provided and user is offline', () => {
      const mockPresence = { status: 'offline' as const, lastSeen: '2024-01-01T00:00:00.000Z' }
      ;(getUserPresence as jest.Mock).mockReturnValue(mockPresence)

      const handler = eventHandlers.get(SocketEvent.GET_PRESENCE)!
      const payload = { user_id: 'target-user-789' }

      handler(payload)

      expect(getUserPresence).toHaveBeenCalledWith('target-user-789')
      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.PRESENCE_STATUS, {
        user_id: 'target-user-789',
        status: 'offline',
        last_seen: '2024-01-01T00:00:00.000Z',
      })
    })

    it('should emit error when user_id is missing', () => {
      const handler = eventHandlers.get(SocketEvent.GET_PRESENCE)!

      handler({})

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.INVALID_PAYLOAD,
        message: 'user_id is required',
      })
      expect(getUserPresence).not.toHaveBeenCalled()
    })

    it('should emit error when payload is null', () => {
      const handler = eventHandlers.get(SocketEvent.GET_PRESENCE)!

      handler(null)

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.INVALID_PAYLOAD,
        message: 'user_id is required',
      })
    })

    it('should emit error when payload is undefined', () => {
      const handler = eventHandlers.get(SocketEvent.GET_PRESENCE)!

      handler(undefined)

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.ERROR, {
        code: SOCKET_ERRORS.INVALID_PAYLOAD,
        message: 'user_id is required',
      })
    })
  })

  describe('broadcastPresenceUpdate', () => {
    it('should broadcast presence update with online status', () => {
      broadcastPresenceUpdate(mockSocket, 'user-123', 'online')

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(SocketEvent.PRESENCE_UPDATE, {
        user_id: 'user-123',
        status: 'online',
        last_seen: null,
      })
    })

    it('should broadcast presence update with offline status and lastSeen', () => {
      broadcastPresenceUpdate(mockSocket, 'user-456', 'offline', '2024-01-15T10:30:00.000Z')

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(SocketEvent.PRESENCE_UPDATE, {
        user_id: 'user-456',
        status: 'offline',
        last_seen: '2024-01-15T10:30:00.000Z',
      })
    })

    it('should broadcast presence update with null lastSeen when not provided', () => {
      broadcastPresenceUpdate(mockSocket, 'user-789', 'offline')

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(SocketEvent.PRESENCE_UPDATE, {
        user_id: 'user-789',
        status: 'offline',
        last_seen: null,
      })
    })
  })
})
