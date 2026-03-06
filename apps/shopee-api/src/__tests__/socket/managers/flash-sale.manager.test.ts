/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

describe('Flash Sale Manager', () => {
  let flashSaleManager: typeof import('../../../socket/managers/flash-sale.manager')

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('startFlashSale', () => {
    it('should start a flash sale with products', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      const endTime = new Date(Date.now() + 3600000)
      flashSaleManager.startFlashSale('sale-1', endTime, [
        { product_id: 'prod-1', stock: 100 },
        { product_id: 'prod-2', stock: 50 },
      ])

      const sale = flashSaleManager.getFlashSale('sale-1')
      expect(sale).toBeDefined()
      expect(sale!.sale_id).toBe('sale-1')
      expect(sale!.products.size).toBe(2)
    })

    it('should track initial and current stock correctly', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      flashSaleManager.startFlashSale('sale-2', new Date(Date.now() + 3600000), [
        { product_id: 'prod-a', stock: 75 },
      ])

      const sale = flashSaleManager.getFlashSale('sale-2')
      const product = sale!.products.get('prod-a')
      expect(product).toEqual({
        product_id: 'prod-a',
        initial_stock: 75,
        current_stock: 75,
        sold: 0,
      })
    })
  })

  describe('endFlashSale', () => {
    it('should remove the flash sale', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      flashSaleManager.startFlashSale('sale-end', new Date(Date.now() + 3600000), [
        { product_id: 'prod-1', stock: 10 },
      ])
      flashSaleManager.endFlashSale('sale-end')

      expect(flashSaleManager.getFlashSale('sale-end')).toBeUndefined()
    })

    it('should clear timer interval if set', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      flashSaleManager.startFlashSale('sale-timer', new Date(Date.now() + 3600000), [])
      const interval = setInterval(() => {}, 1000)
      flashSaleManager.setFlashSaleTimer('sale-timer', interval)
      flashSaleManager.endFlashSale('sale-timer')

      expect(flashSaleManager.getFlashSale('sale-timer')).toBeUndefined()
      clearInterval(interval) // cleanup just in case
    })

    it('should handle ending non-existent sale gracefully', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      expect(() => flashSaleManager.endFlashSale('non-existent')).not.toThrow()
    })
  })

  describe('getActiveFlashSales', () => {
    it('should return empty array when no sales active', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      expect(flashSaleManager.getActiveFlashSales()).toEqual([])
    })

    it('should return all active flash sales', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      flashSaleManager.startFlashSale('s1', new Date(Date.now() + 3600000), [])
      flashSaleManager.startFlashSale('s2', new Date(Date.now() + 3600000), [])

      expect(flashSaleManager.getActiveFlashSales()).toHaveLength(2)
    })
  })

  describe('decrementStock', () => {
    it('should decrement stock and increase sold count', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      flashSaleManager.startFlashSale('sale-dec', new Date(Date.now() + 3600000), [
        { product_id: 'prod-x', stock: 10 },
      ])

      const result = flashSaleManager.decrementStock('sale-dec', 'prod-x', 3)
      expect(result).toEqual({
        product_id: 'prod-x',
        initial_stock: 10,
        current_stock: 7,
        sold: 3,
      })
    })

    it('should return null for insufficient stock', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      flashSaleManager.startFlashSale('sale-low', new Date(Date.now() + 3600000), [
        { product_id: 'prod-y', stock: 2 },
      ])

      expect(flashSaleManager.decrementStock('sale-low', 'prod-y', 5)).toBeNull()
    })

    it('should return null for non-existent sale', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      expect(flashSaleManager.decrementStock('no-sale', 'prod-z')).toBeNull()
    })

    it('should return null for non-existent product in sale', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      flashSaleManager.startFlashSale('sale-np', new Date(Date.now() + 3600000), [
        { product_id: 'prod-1', stock: 10 },
      ])

      expect(flashSaleManager.decrementStock('sale-np', 'prod-missing')).toBeNull()
    })

    it('should default quantity to 1', async () => {
      flashSaleManager = await import('../../../socket/managers/flash-sale.manager')

      flashSaleManager.startFlashSale('sale-def', new Date(Date.now() + 3600000), [
        { product_id: 'prod-d', stock: 5 },
      ])

      const result = flashSaleManager.decrementStock('sale-def', 'prod-d')
      expect(result!.current_stock).toBe(4)
      expect(result!.sold).toBe(1)
    })
  })
})
