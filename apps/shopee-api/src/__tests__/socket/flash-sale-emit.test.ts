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

jest.mock('../../socket/managers/flash-sale.manager', () => ({
  getFlashSale: jest.fn(),
  setFlashSaleTimer: jest.fn(),
  endFlashSale: jest.fn(),
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
    it('should call setFlashSaleTimer with the interval reference', async () => {
      await setupMock()
      const { getFlashSale, setFlashSaleTimer } =
        await import('../../socket/managers/flash-sale.manager')
      const futureTime = new Date(Date.now() + 5000)
      const mockSale = {
        sale_id: 'sale123',
        end_time: futureTime,
        products: new Map(),
      }
      ;(getFlashSale as jest.Mock).mockReturnValue(mockSale)

      const { startFlashSaleTimer } = await import('../../socket/utils/flash-sale-emit')
      startFlashSaleTimer('sale123')

      expect(setFlashSaleTimer).toHaveBeenCalledWith('sale123', expect.anything())
    })

    it('should emit FLASH_SALE_TICK on each interval tick when sale is active', async () => {
      await setupMock()
      const { getFlashSale } = await import('../../socket/managers/flash-sale.manager')
      const futureTime = new Date(Date.now() + 5000)
      const mockProducts = new Map([['prod1', { product_id: 'prod1', current_stock: 10, sold: 5 }]])
      const mockSale = {
        sale_id: 'sale123',
        end_time: futureTime,
        products: mockProducts,
      }
      ;(getFlashSale as jest.Mock).mockReturnValue(mockSale)

      const { startFlashSaleTimer } = await import('../../socket/utils/flash-sale-emit')
      startFlashSaleTimer('sale123')

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

    it('should clear interval when sale is not found', async () => {
      await setupMock()
      const { getFlashSale, endFlashSale } =
        await import('../../socket/managers/flash-sale.manager')
      ;(getFlashSale as jest.Mock).mockReturnValue(null)

      const { startFlashSaleTimer } = await import('../../socket/utils/flash-sale-emit')
      startFlashSaleTimer('sale123')

      jest.advanceTimersByTime(1000)
      mockEmit.mockClear()

      jest.advanceTimersByTime(1000)

      expect(mockEmit).not.toHaveBeenCalledWith(SocketEvent.FLASH_SALE_TICK, expect.anything())
      expect(endFlashSale).not.toHaveBeenCalled()
    })

    it('should call endFlashSale and clear interval when time has expired', async () => {
      await setupMock()
      const { getFlashSale, endFlashSale } =
        await import('../../socket/managers/flash-sale.manager')
      const pastTime = new Date(Date.now() - 1000)
      const mockSale = {
        sale_id: 'sale123',
        end_time: pastTime,
        products: new Map(),
      }
      ;(getFlashSale as jest.Mock).mockReturnValue(mockSale)

      const { startFlashSaleTimer } = await import('../../socket/utils/flash-sale-emit')
      startFlashSaleTimer('sale123')

      jest.advanceTimersByTime(1000)

      expect(endFlashSale).toHaveBeenCalledWith('sale123')
      expect(mockEmit).not.toHaveBeenCalledWith(SocketEvent.FLASH_SALE_TICK, expect.anything())
    })
  })
})
