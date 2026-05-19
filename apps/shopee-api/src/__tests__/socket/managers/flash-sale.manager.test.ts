/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

// Mock the flash-sale-emit re-export so clearFlashSaleTimer is a jest.fn()
jest.mock('../../../socket/utils/flash-sale-emit', () => ({
  clearFlashSaleTimer: jest.fn(),
  startFlashSaleTimer: jest.fn(),
  emitFlashSaleStockUpdate: jest.fn(),
}))

describe('Flash Sale Manager', () => {
  let flashSaleManager: typeof import('../../../socket/managers/flash-sale.manager')

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  describe('getActiveFlashSales', () => {
    it('should return active flash sales from the service', async () => {
      const mockSales = [
        { _id: 'sale-1', status: 'active' },
        { _id: 'sale-2', status: 'active' },
      ]
      jest.doMock('../../../container', () => ({
        flashSaleService: {
          getActive: jest.fn().mockResolvedValue(mockSales),
          purchaseFlashSaleItem: jest.fn(),
        },
      }))

      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')
      const result = await flashSaleManager.getActiveFlashSales()

      expect(result).toEqual(mockSales)
    })

    it('should return empty array when no active sales', async () => {
      jest.doMock('../../../container', () => ({
        flashSaleService: {
          getActive: jest.fn().mockResolvedValue([]),
          purchaseFlashSaleItem: jest.fn(),
        },
      }))

      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')
      const result = await flashSaleManager.getActiveFlashSales()

      expect(result).toEqual([])
    })
  })

  describe('decrementStock', () => {
    it('should call purchaseFlashSaleItem and return updated sale', async () => {
      const mockUpdatedSale = { _id: 'sale-1', status: 'active' }
      const mockPurchase = jest.fn().mockResolvedValue(mockUpdatedSale)
      jest.doMock('../../../container', () => ({
        flashSaleService: {
          getActive: jest.fn(),
          purchaseFlashSaleItem: mockPurchase,
        },
      }))

      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')
      const result = await flashSaleManager.decrementStock('sale-1', 'prod-1', 'user-1', 2)

      expect(mockPurchase).toHaveBeenCalledWith('sale-1', 'prod-1', 'user-1', 2)
      expect(result).toEqual(mockUpdatedSale)
    })

    it('should return null when purchaseFlashSaleItem throws', async () => {
      jest.doMock('../../../container', () => ({
        flashSaleService: {
          getActive: jest.fn(),
          purchaseFlashSaleItem: jest.fn().mockRejectedValue(new Error('Out of stock')),
        },
      }))

      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')
      const result = await flashSaleManager.decrementStock('sale-1', 'prod-1', 'user-1')

      expect(result).toBeNull()
    })

    it('should use default quantity of 1 when not provided', async () => {
      const mockPurchase = jest.fn().mockResolvedValue({ _id: 'sale-1' })
      jest.doMock('../../../container', () => ({
        flashSaleService: {
          getActive: jest.fn(),
          purchaseFlashSaleItem: mockPurchase,
        },
      }))

      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')
      await flashSaleManager.decrementStock('sale-1', 'prod-1', 'user-1')

      expect(mockPurchase).toHaveBeenCalledWith('sale-1', 'prod-1', 'user-1', 1)
    })
  })

  describe('clearFlashSaleTimer (re-export)', () => {
    it('should re-export clearFlashSaleTimer from flash-sale-emit', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      expect(typeof flashSaleManager.clearFlashSaleTimer).toBe('function')
    })
  })
})
