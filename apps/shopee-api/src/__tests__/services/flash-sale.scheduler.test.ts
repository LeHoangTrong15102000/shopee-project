/// <reference types="jest" />

/**
 * Unit Tests for FlashSaleScheduler (Task 10.3)
 * - activate on startTime
 * - end on endTime
 * - startup recovery
 */

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiWarn: jest.fn(), apiError: jest.fn() },
}))

jest.mock('@constants/config', () => ({
  config: { FLASH_SALE_CHECK_INTERVAL: 60 },
}))

jest.mock('@database/models/flash-sale.model', () => {
  const mockFind = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
  const mockFindByIdAndUpdate = jest.fn().mockResolvedValue({})
  return {
    FlashSaleModel: {
      find: mockFind,
      findByIdAndUpdate: mockFindByIdAndUpdate,
    },
  }
})

jest.mock('../../socket/socket.init', () => ({
  getIO: jest.fn().mockReturnValue({ emit: jest.fn() }),
}))

jest.mock('../../socket/utils/flash-sale-emit', () => ({
  startFlashSaleTimer: jest.fn(),
  clearFlashSaleTimer: jest.fn(),
}))

jest.mock('../../container', () => ({
  auditLogService: { writeLog: jest.fn() },
}))

import { FlashSaleScheduler } from '@services/flash-sale.scheduler'
import { FlashSaleService } from '@services/flash-sale.service'
import { Types } from 'mongoose'

describe('FlashSaleScheduler', () => {
  let scheduler: FlashSaleScheduler
  let mockService: jest.Mocked<FlashSaleService>
  let FlashSaleModel: any

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockService = {} as jest.Mocked<FlashSaleService>
    scheduler = new FlashSaleScheduler(mockService)

    FlashSaleModel = (await import('@database/models/flash-sale.model')).FlashSaleModel
  })

  afterEach(() => {
    scheduler.stop()
    jest.useRealTimers()
  })

  it('activates SCHEDULED flash sales whose startTime has passed', async () => {
    const saleId = new Types.ObjectId()
    const scheduledSale = {
      _id: saleId,
      name: 'Test Sale',
      status: 'SCHEDULED',
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 3600_000),
      products: [],
    }

    // First call (SCHEDULED check) returns the sale, second call (ACTIVE check) returns empty
    FlashSaleModel.find
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([scheduledSale]) })
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([]) })

    await scheduler.start()

    expect(FlashSaleModel.findByIdAndUpdate).toHaveBeenCalledWith(saleId, {
      $set: { status: 'ACTIVE' },
    })
  })

  it('ends ACTIVE flash sales whose endTime has passed', async () => {
    const saleId = new Types.ObjectId()
    const expiredSale = {
      _id: saleId,
      name: 'Expired Sale',
      status: 'ACTIVE',
      startTime: new Date(Date.now() - 7200_000),
      endTime: new Date(Date.now() - 1000),
      products: [],
    }

    // First call (SCHEDULED check) returns empty, second call (ACTIVE check) returns the sale
    FlashSaleModel.find
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([]) })
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([expiredSale]) })

    await scheduler.start()

    expect(FlashSaleModel.findByIdAndUpdate).toHaveBeenCalledWith(saleId, {
      $set: { status: 'ENDED' },
    })
  })

  it('does nothing when no flash sales need status change', async () => {
    FlashSaleModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })

    await scheduler.start()

    expect(FlashSaleModel.findByIdAndUpdate).not.toHaveBeenCalled()
  })

  it('stops the interval on stop()', async () => {
    FlashSaleModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })

    await scheduler.start()
    scheduler.stop()

    // Advance time past the interval — no more checks should run
    FlashSaleModel.find.mockClear()
    jest.advanceTimersByTime(120_000)

    // Give any pending promises a chance to resolve
    await Promise.resolve()

    expect(FlashSaleModel.find).not.toHaveBeenCalled()
  })
})
