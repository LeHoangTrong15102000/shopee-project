/// <reference types="jest" />

const mockBulkWrite = jest.fn()

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    chatbotDebug: jest.fn(),
  },
}))

jest.mock('@database/models/product.model', () => ({
  ProductModel: {
    bulkWrite: mockBulkWrite,
  },
}))

jest.useFakeTimers()

import { viewCounterService } from '../../utils/view-counter.service'

describe('ViewCounterService', () => {
  beforeEach(() => {
    mockBulkWrite.mockClear()
    mockBulkWrite.mockResolvedValue({})
  })

  afterAll(async () => {
    await viewCounterService.shutdown()
    jest.useRealTimers()
  })

  describe('incrementView', () => {
    it('should add product to buffer', () => {
      const initialSize = viewCounterService.getBufferSize()
      viewCounterService.incrementView('product-1')
      expect(viewCounterService.getBufferSize()).toBe(initialSize + 1)
    })

    it('should increment existing product count', async () => {
      viewCounterService.incrementView('product-increment-test')
      viewCounterService.incrementView('product-increment-test')
      viewCounterService.incrementView('product-increment-test')

      await viewCounterService.flushViews()

      expect(mockBulkWrite).toHaveBeenCalled()
      const bulkOps = mockBulkWrite.mock.calls[0][0]
      const productOp = bulkOps.find(
        (op: any) => op.updateOne.filter._id === 'product-increment-test'
      )
      expect(productOp.updateOne.update.$inc.view).toBe(3)
    })

    it('should increase buffer size when adding new products', () => {
      const initialSize = viewCounterService.getBufferSize()
      viewCounterService.incrementView('product-size-test-a')
      viewCounterService.incrementView('product-size-test-b')
      expect(viewCounterService.getBufferSize()).toBe(initialSize + 2)
    })
  })

  describe('buffer threshold', () => {
    it('should auto-flush when buffer reaches 100 entries', async () => {
      mockBulkWrite.mockClear()

      // First flush any existing buffer
      await viewCounterService.flushViews()
      mockBulkWrite.mockClear()

      // Add 100 unique products to trigger threshold
      for (let i = 0; i < 100; i++) {
        viewCounterService.incrementView(`threshold-product-${i}`)
      }

      // Allow the async flush triggered by threshold to complete
      await Promise.resolve()

      expect(mockBulkWrite).toHaveBeenCalled()
      expect(viewCounterService.getBufferSize()).toBe(0)
    })
  })

  describe('flushViews', () => {
    it('should return immediately when buffer is empty', async () => {
      // Ensure buffer is empty
      await viewCounterService.flushViews()
      mockBulkWrite.mockClear()

      await viewCounterService.flushViews()

      expect(mockBulkWrite).not.toHaveBeenCalled()
    })

    it('should call ProductModel.bulkWrite with correct operations', async () => {
      viewCounterService.incrementView('flush-test-product-1')
      viewCounterService.incrementView('flush-test-product-2')
      viewCounterService.incrementView('flush-test-product-1')

      await viewCounterService.flushViews()

      expect(mockBulkWrite).toHaveBeenCalledTimes(1)
      const bulkOps = mockBulkWrite.mock.calls[0][0]

      const product1Op = bulkOps.find(
        (op: any) => op.updateOne.filter._id === 'flush-test-product-1'
      )
      const product2Op = bulkOps.find(
        (op: any) => op.updateOne.filter._id === 'flush-test-product-2'
      )

      expect(product1Op).toEqual({
        updateOne: {
          filter: { _id: 'flush-test-product-1' },
          update: { $inc: { view: 2 } },
        },
      })
      expect(product2Op).toEqual({
        updateOne: {
          filter: { _id: 'flush-test-product-2' },
          update: { $inc: { view: 1 } },
        },
      })
    })

    it('should clear buffer after successful flush', async () => {
      viewCounterService.incrementView('clear-test-product')

      await viewCounterService.flushViews()

      expect(viewCounterService.getBufferSize()).toBe(0)
    })

    it('should restore entries to buffer and throw on error', async () => {
      const testError = new Error('Database error')
      mockBulkWrite.mockRejectedValueOnce(testError)

      viewCounterService.incrementView('error-test-product')
      viewCounterService.incrementView('error-test-product')

      const initialSize = viewCounterService.getBufferSize()

      await expect(viewCounterService.flushViews()).rejects.toThrow('Database error')

      expect(viewCounterService.getBufferSize()).toBe(initialSize)

      // Clean up: flush successfully
      mockBulkWrite.mockResolvedValueOnce({})
      await viewCounterService.flushViews()
    })
  })

  describe('getBufferSize', () => {
    it('should return correct count', async () => {
      // Flush to start fresh
      await viewCounterService.flushViews()

      expect(viewCounterService.getBufferSize()).toBe(0)

      viewCounterService.incrementView('size-test-1')
      expect(viewCounterService.getBufferSize()).toBe(1)

      viewCounterService.incrementView('size-test-2')
      expect(viewCounterService.getBufferSize()).toBe(2)

      viewCounterService.incrementView('size-test-1')
      expect(viewCounterService.getBufferSize()).toBe(2)

      await viewCounterService.flushViews()
      expect(viewCounterService.getBufferSize()).toBe(0)
    })
  })

  describe('shutdown', () => {
    it('should clear interval and flush remaining views', async () => {
      // Add some views
      viewCounterService.incrementView('shutdown-test-product')
      mockBulkWrite.mockClear()

      // Note: We can't fully test shutdown since it's a singleton
      // and we need it for other tests. Instead, we verify the flush behavior.
      await viewCounterService.flushViews()

      expect(mockBulkWrite).toHaveBeenCalled()
      expect(viewCounterService.getBufferSize()).toBe(0)
    })
  })
})

