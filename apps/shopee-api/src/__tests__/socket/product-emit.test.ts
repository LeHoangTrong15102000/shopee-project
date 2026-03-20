/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

describe('Product Emit Utils', () => {
  let mockIO: any
  let mockEmit: jest.Mock

  const setupMock = async (throwError = false) => {
    jest.resetModules()
    mockEmit = jest.fn()
    mockIO = { to: jest.fn().mockReturnValue({ emit: mockEmit }) }
    const { getIORequired } = await import('../../socket/socket.init')
    if (throwError) {
      ;(getIORequired as jest.Mock).mockImplementation(() => { throw new Error('IO not initialized') })
    } else {
      ;(getIORequired as jest.Mock).mockReturnValue(mockIO)
    }
  }

  afterEach(() => jest.clearAllMocks())

  describe('emitPriceUpdate', () => {
    it('should emit price update to product room', async () => {
      await setupMock()
      const { emitPriceUpdate } = await import('../../socket/utils/product-emit')
      emitPriceUpdate('prod1', 100, 80, 120, 100)
      expect(mockIO.to).toHaveBeenCalled()
      expect(mockEmit).toHaveBeenCalled()
    })

    it('should handle error gracefully', async () => {
      await setupMock(true)
      const { emitPriceUpdate } = await import('../../socket/utils/product-emit')
      expect(() => emitPriceUpdate('prod1', 100, 80, 120, 100)).not.toThrow()
    })
  })
})
