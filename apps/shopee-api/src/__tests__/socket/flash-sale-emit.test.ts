/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

jest.mock('@constants/socket', () => ({
  SOCKET_CONFIG: {
    ROOM_PREFIX: { FLASH_SALE: 'flash_sale:' },
  },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

import { SocketEvent } from '../../@types/socket.type'

describe('Flash Sale Emit Utils', () => {
  let mockIO: any
  let mockEmit: jest.Mock

  const setupMockIO = () => {
    mockEmit = jest.fn()
    mockIO = {
      to: jest.fn().mockReturnValue({ emit: mockEmit }),
    }
  }

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

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  describe('emitFlashSaleStockUpdate', () => {
    it('should emit FLASH_SALE_STOCK_UPDATE to the correct flash sale room', async () => {
      await setupMock()
      const { emitFlashSaleStockUpdate } = await import('../../socket/utils/flash-sale-emit')
      emitFlashSaleStockUpdate('sale123', 'product456', 10, 5)

      expect(mockIO.to).toHaveBeenCalledWith('flash_sale:sale123')
      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.FLASH_SALE_STOCK_UPDATE, {
        sale_id: 'sale123',
        product_id: 'product456',
        current_stock: 10,
        sold: 5,
        buyer_name: undefined,
      })
    })

    it('should include buyer_name in payload when provided', async () => {
      await setupMock()
      const { emitFlashSaleStockUpdate } = await import('../../socket/utils/flash-sale-emit')
      emitFlashSaleStockUpdate('sale123', 'product456', 10, 5, 'John Doe')

      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.FLASH_SALE_STOCK_UPDATE, {
        sale_id: 'sale123',
        product_id: 'product456',
        current_stock: 10,
        sold: 5,
        buyer_name: 'John Doe',
      })
    })

    it('should handle errors gracefully when emit fails', async () => {
      await setupMock(true)
      const { emitFlashSaleStockUpdate } = await import('../../socket/utils/flash-sale-emit')

      expect(() => emitFlashSaleStockUpdate('sale123', 'product456', 10, 5)).not.toThrow()
    })
  })

  describe('startFlashSaleTimer', () => {
    it('should store the interval in the timer map and start ticking', async () => {
      await setupMock()
      const futureTime = new Date(Date.now() + 5000)
      const products = [
        { productId: { toString: () => 'prod1' }, totalQuantity: 15, soldQuantity: 5 },
      ] as any

      const { startFlashSaleTimer } = await import('../../socket/utils/flash-sale-emit')
      startFlashSaleTimer('sale123', futureTime, products)

      jest.advanceTimersByTime(1000)

      expect(mockIO.to).toHaveBeenCalledWith('flash_sale:sale123')
      expect(mockEmit).toHaveBeenCalledWith(
        SocketEvent.FLASH_SALE_TICK,
        expect.objectContaining({
          sale_id: 'sale123',
          remaining_seconds: expect.any(Number),
          products: [{ product_id: 'prod1', current_stock: 10, sold: 5 }],
        }),
      )
    })

    it('should clear interval when time has expired', async () => {
      await setupMock()
      const pastTime = new Date(Date.now() - 1000)
      const products: any[] = []

      const { startFlashSaleTimer } = await import('../../socket/utils/flash-sale-emit')
      startFlashSaleTimer('sale-expired', pastTime, products)

      jest.advanceTimersByTime(1000)

      expect(mockEmit).not.toHaveBeenCalledWith(SocketEvent.FLASH_SALE_TICK, expect.anything())
    })

    it('should handle errors gracefully when IO is not initialized', async () => {
      await setupMock(true)
      const futureTime = new Date(Date.now() + 5000)
      const products: any[] = []

      const { startFlashSaleTimer } = await import('../../socket/utils/flash-sale-emit')
      expect(() => startFlashSaleTimer('sale-err', futureTime, products)).not.toThrow()

      jest.advanceTimersByTime(1000)
      // No crash expected
    })
  })

  describe('clearFlashSaleTimer', () => {
    it('should clear the timer for a sale', async () => {
      await setupMock()
      const futureTime = new Date(Date.now() + 10000)
      const products: any[] = []

      const { startFlashSaleTimer, clearFlashSaleTimer } =
        await import('../../socket/utils/flash-sale-emit')
      startFlashSaleTimer('sale-clear', futureTime, products)

      clearFlashSaleTimer('sale-clear')

      // After clearing, advancing time should not emit ticks
      jest.advanceTimersByTime(2000)
      expect(mockEmit).not.toHaveBeenCalledWith(SocketEvent.FLASH_SALE_TICK, expect.anything())
    })

    it('should handle clearing non-existent timer gracefully', async () => {
      await setupMock()
      const { clearFlashSaleTimer } = await import('../../socket/utils/flash-sale-emit')

      expect(() => clearFlashSaleTimer('non-existent')).not.toThrow()
    })
  })
})
