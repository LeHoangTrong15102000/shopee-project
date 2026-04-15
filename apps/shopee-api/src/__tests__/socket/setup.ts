/// <reference types="jest" />
/**
 * Socket Test Setup
 * Provides mock socket factory for unit testing socket handlers
 */

export interface MockSocket {
  id: string
  user: { id: string; email: string; roles: string[] }
  emit: jest.Mock
  on: jest.Mock
  join: jest.Mock
  leave: jest.Mock
  to: jest.Mock
  broadcast: { emit: jest.Mock }
  disconnect: jest.Mock
  rooms: Set<string>
}

export const createMockSocket = (overrides: Partial<MockSocket> = {}): MockSocket => {
  const mockSocket: MockSocket = {
    id: 'test-socket-id',
    user: { id: 'test-user-id', email: 'test@test.com', roles: ['User'] },
    emit: jest.fn(),
    on: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    broadcast: { emit: jest.fn() },
    disconnect: jest.fn(),
    rooms: new Set(['test-socket-id']),
    ...overrides,
  }
  // Make .to() chainable with .emit()
  mockSocket.to = jest.fn().mockReturnValue({ emit: jest.fn() })
  return mockSocket
}

export interface MockIO {
  to: jest.Mock
  emit: jest.Mock
  sockets: {
    adapter: {
      rooms: Map<string, Set<string>>
    }
  }
}

export const createMockIO = (): MockIO => {
  const mockEmit = jest.fn()
  return {
    to: jest.fn().mockReturnValue({ emit: mockEmit }),
    emit: mockEmit,
    sockets: {
      adapter: {
        rooms: new Map(),
      },
    },
  }
}
