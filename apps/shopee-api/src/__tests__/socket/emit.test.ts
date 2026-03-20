/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

describe('Core Emit Utils', () => {
  let mockIO: any
  let mockEmit: jest.Mock

  const setupMockIO = () => {
    mockEmit = jest.fn()
    mockIO = {
      to: jest.fn().mockReturnValue({
        emit: mockEmit,
        except: jest.fn().mockReturnValue({ emit: mockEmit }),
      }),
    }
  }

  const setupMock = async (throwError = false) => {
    jest.resetModules()
    setupMockIO()
    const { getIORequired } = await import('../../socket/socket.init')
    if (throwError) {
      ;(getIORequired as jest.Mock).mockImplementation(() => { throw new Error('IO not initialized') })
    } else {
      ;(getIORequired as jest.Mock).mockReturnValue(mockIO)
    }
  }

  afterEach(() => jest.clearAllMocks())

  describe('emitToUser', () => {
    it('should emit event to user room', async () => {
      await setupMock()
      const { emitToUser } = await import('../../socket/utils/emit')
      const result = emitToUser('user1', 'test_event', { data: 'test' })
      expect(result).toBe(true)
      expect(mockIO.to).toHaveBeenCalled()
      expect(mockEmit).toHaveBeenCalledWith('test_event', { data: 'test' })
    })

    it('should return false on error', async () => {
      await setupMock(true)
      const { emitToUser } = await import('../../socket/utils/emit')
      const result = emitToUser('user1', 'test_event', {})
      expect(result).toBe(false)
    })
  })

  describe('emitToUsers', () => {
    it('should emit to multiple users', async () => {
      await setupMock()
      const { emitToUsers } = await import('../../socket/utils/emit')
      emitToUsers(['u1', 'u2'], 'event', { data: 1 })
      expect(mockIO.to).toHaveBeenCalledTimes(2)
    })

    it('should handle error gracefully', async () => {
      await setupMock(true)
      const { emitToUsers } = await import('../../socket/utils/emit')
      expect(() => emitToUsers(['u1'], 'event', {})).not.toThrow()
    })
  })

  describe('emitToChat', () => {
    it('should emit to chat room', async () => {
      await setupMock()
      const { emitToChat } = await import('../../socket/utils/emit')
      emitToChat('chat1', 'msg', { text: 'hi' })
      expect(mockIO.to).toHaveBeenCalled()
      expect(mockEmit).toHaveBeenCalledWith('msg', { text: 'hi' })
    })
  })

  describe('emitToChatExcludeSender', () => {
    it('should emit to chat room excluding sender', async () => {
      await setupMock()
      const { emitToChatExcludeSender } = await import('../../socket/utils/emit')
      emitToChatExcludeSender('chat1', 'socket1', 'msg', { text: 'hi' })
      expect(mockIO.to).toHaveBeenCalled()
    })
  })

  describe('emitNotification', () => {
    it('should emit notification to user', async () => {
      await setupMock()
      const { emitNotification } = await import('../../socket/utils/emit')
      const result = emitNotification('user1', { _id: 'n1', type: 'order', title: 'Test', content: 'Content' } as any)
      expect(result).toBe(true)
    })

    it('should return false on error', async () => {
      await setupMock(true)
      const { emitNotification } = await import('../../socket/utils/emit')
      const result = emitNotification('user1', {} as any)
      expect(result).toBe(false)
    })
  })

  describe('emitError', () => {
    it('should emit error to socket', async () => {
      await setupMock()
      const { emitError } = await import('../../socket/utils/emit')
      emitError('socket1', { code: 'ERR', message: 'fail' })
      expect(mockIO.to).toHaveBeenCalledWith('socket1')
    })
  })
})
