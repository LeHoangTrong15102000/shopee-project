/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

describe('Presence Manager', () => {
  let presenceManager: typeof import('../../../socket/managers/presence.manager')

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('addUserSocket', () => {
    it('should add a socket for a new user', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      presenceManager.addUserSocket('user-123', 'socket-1')

      expect(presenceManager.isUserOnline('user-123')).toBe(true)
    })

    it('should add multiple sockets for the same user', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      presenceManager.addUserSocket('user-456', 'socket-1')
      presenceManager.addUserSocket('user-456', 'socket-2')

      expect(presenceManager.isUserOnline('user-456')).toBe(true)
    })
  })

  describe('removeUserSocket', () => {
    it('should return true when user goes fully offline', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      presenceManager.addUserSocket('user-789', 'socket-1')
      const result = presenceManager.removeUserSocket('user-789', 'socket-1')

      expect(result).toBe(true)
      expect(presenceManager.isUserOnline('user-789')).toBe(false)
    })

    it('should return false when user still has other sockets', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      presenceManager.addUserSocket('user-multi', 'socket-1')
      presenceManager.addUserSocket('user-multi', 'socket-2')
      const result = presenceManager.removeUserSocket('user-multi', 'socket-1')

      expect(result).toBe(false)
      expect(presenceManager.isUserOnline('user-multi')).toBe(true)
    })

    it('should return false when user does not exist', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      const result = presenceManager.removeUserSocket('non-existent', 'socket-1')

      expect(result).toBe(false)
    })
  })

  describe('isUserOnline', () => {
    it('should return false for unknown user', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      expect(presenceManager.isUserOnline('unknown-user')).toBe(false)
    })

    it('should return true for user with active sockets', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      presenceManager.addUserSocket('online-user', 'socket-1')

      expect(presenceManager.isUserOnline('online-user')).toBe(true)
    })

    it('should return false for user who went offline', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      presenceManager.addUserSocket('was-online', 'socket-1')
      presenceManager.removeUserSocket('was-online', 'socket-1')

      expect(presenceManager.isUserOnline('was-online')).toBe(false)
    })
  })

  describe('getUserPresence', () => {
    it('should return offline status for unknown user', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      const presence = presenceManager.getUserPresence('unknown')

      expect(presence).toEqual({ status: 'offline', lastSeen: null })
    })

    it('should return online status for user with active sockets', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      presenceManager.addUserSocket('active-user', 'socket-1')
      const presence = presenceManager.getUserPresence('active-user')

      expect(presence).toEqual({ status: 'online', lastSeen: null })
    })

    it('should return offline status with lastSeen for user who went offline', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      presenceManager.addUserSocket('offline-user', 'socket-1')
      presenceManager.removeUserSocket('offline-user', 'socket-1')
      const presence = presenceManager.getUserPresence('offline-user')

      expect(presence.status).toBe('offline')
      expect(presence.lastSeen).toBeDefined()
      expect(typeof presence.lastSeen).toBe('string')
    })
  })

  describe('getOnlineUserCount', () => {
    it('should return 0 when no users are online', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      expect(presenceManager.getOnlineUserCount()).toBe(0)
    })

    it('should return correct count of online users', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      presenceManager.addUserSocket('user-a', 'socket-a')
      presenceManager.addUserSocket('user-b', 'socket-b')
      presenceManager.addUserSocket('user-c', 'socket-c')

      expect(presenceManager.getOnlineUserCount()).toBe(3)
    })

    it('should not count users who went offline', async () => {
      presenceManager = await import('../../../socket/managers/presence.manager')

      presenceManager.addUserSocket('user-x', 'socket-x')
      presenceManager.addUserSocket('user-y', 'socket-y')
      presenceManager.removeUserSocket('user-x', 'socket-x')

      expect(presenceManager.getOnlineUserCount()).toBe(1)
    })
  })
})
