/// <reference types="jest" />

/**
 * Unit Tests for FlashSaleScheduler (BullMQ repeatable job registration)
 * - registers repeatable job on start()
 * - uses correct interval from config
 * - stop() is a no-op (backward compat)
 */

const mockFlashSaleSchedulerQueueAdd = jest.fn().mockResolvedValue({ id: 'job-1' })

jest.mock('../../queues', () => ({
  flashSaleSchedulerQueue: {
    add: mockFlashSaleSchedulerQueueAdd,
  },
  emailQueue: { add: jest.fn() },
  notificationQueue: { add: jest.fn() },
  searchSyncQueue: { add: jest.fn() },
  cleanupQueue: { add: jest.fn() },
  paymentReconciliationQueue: { add: jest.fn() },
  refundStatusPollQueue: { add: jest.fn() },
}))

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiWarn: jest.fn(), apiError: jest.fn() },
}))

jest.mock('@constants/config', () => ({
  config: { FLASH_SALE_CHECK_INTERVAL: 60 },
}))

import { FlashSaleScheduler } from '@services/flash-sale.scheduler'

describe('FlashSaleScheduler', () => {
  let scheduler: FlashSaleScheduler

  beforeEach(() => {
    jest.clearAllMocks()
    scheduler = new FlashSaleScheduler()
  })

  it('registers a BullMQ repeatable job on start()', async () => {
    await scheduler.start()

    expect(mockFlashSaleSchedulerQueueAdd).toHaveBeenCalledTimes(1)
    const [jobName, payload, options] = mockFlashSaleSchedulerQueueAdd.mock.calls[0]
    expect(jobName).toBe('flash-sale-check')
    expect(payload.triggeredAt).toBeDefined()
    expect(options.repeat).toBeDefined()
    expect(options.repeat.every).toBe(60000)
    expect(options.jobId).toBe('flash-sale-check-repeatable')
  })

  it('uses FLASH_SALE_CHECK_INTERVAL from config for repeat interval', async () => {
    await scheduler.start()

    const [, , options] = mockFlashSaleSchedulerQueueAdd.mock.calls[0]
    // config.FLASH_SALE_CHECK_INTERVAL = 60 seconds → 60000 ms
    expect(options.repeat.every).toBe(60 * 1000)
  })

  it('stop() does not throw and is a no-op', () => {
    // stop() should not throw — it's kept for backward compat with graceful shutdown
    expect(() => scheduler.stop()).not.toThrow()
  })

  it('includes a triggeredAt ISO timestamp in the payload', async () => {
    await scheduler.start()

    const [, payload] = mockFlashSaleSchedulerQueueAdd.mock.calls[0]
    expect(payload.triggeredAt).toBeDefined()
    // Verify it's a valid ISO date string
    expect(new Date(payload.triggeredAt).toISOString()).toBe(payload.triggeredAt)
  })
})
