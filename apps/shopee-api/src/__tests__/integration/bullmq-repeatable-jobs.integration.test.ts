/**
 * Integration tests verifying BullMQ repeatable jobs are registered correctly
 * for PaymentReconciliationJob and RefundStatusPollJob.
 *
 * These tests mock the queue singletons so no real Redis connection is needed.
 */

/// <reference types="jest" />

// ── Mock the queue singletons before importing the job classes ───────────────
const mockPaymentReconciliationQueueAdd = jest.fn().mockResolvedValue({ id: 'job-1' })
const mockRefundStatusPollQueueAdd = jest.fn().mockResolvedValue({ id: 'job-2' })

jest.mock('../../queues', () => ({
  paymentReconciliationQueue: {
    add: mockPaymentReconciliationQueueAdd,
  },
  refundStatusPollQueue: {
    add: mockRefundStatusPollQueueAdd,
  },
  emailQueue: { add: jest.fn() },
  notificationQueue: { add: jest.fn() },
  searchSyncQueue: { add: jest.fn() },
  cleanupQueue: { add: jest.fn() },
  flashSaleSchedulerQueue: { add: jest.fn() },
}))

import { PaymentReconciliationJob } from '@jobs/payment-reconciliation.job'
import { RefundStatusPollJob } from '@jobs/refund-status-poll.job'

describe('BullMQ repeatable job registration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear env overrides between tests
    delete process.env.RECONCILIATION_INTERVAL_HOURS
    delete process.env.MOMO_REFUND_POLL_INTERVAL_MS
  })

  describe('PaymentReconciliationJob', () => {
    it('calls queue.add with a repeat option when start() is called', async () => {
      const job = new PaymentReconciliationJob()
      await job.start()

      expect(mockPaymentReconciliationQueueAdd).toHaveBeenCalledTimes(1)
      const [jobName, _payload, options] = mockPaymentReconciliationQueueAdd.mock.calls[0]
      expect(jobName).toBe('payment-reconciliation')
      expect(options.repeat).toBeDefined()
      expect(typeof options.repeat.every).toBe('number')
      expect(options.repeat.every).toBeGreaterThan(0)
    })

    it('uses the default 24-hour interval when env var is not set', async () => {
      const job = new PaymentReconciliationJob()
      await job.start()

      const [, , options] = mockPaymentReconciliationQueueAdd.mock.calls[0]
      const expectedMs = 24 * 60 * 60 * 1000
      expect(options.repeat.every).toBe(expectedMs)
    })

    it('uses the configured interval from RECONCILIATION_INTERVAL_HOURS', async () => {
      process.env.RECONCILIATION_INTERVAL_HOURS = '12'
      const job = new PaymentReconciliationJob()
      await job.start()

      const [, , options] = mockPaymentReconciliationQueueAdd.mock.calls[0]
      const expectedMs = 12 * 60 * 60 * 1000
      expect(options.repeat.every).toBe(expectedMs)
    })

    it('sets a stable jobId for deduplication', async () => {
      const job = new PaymentReconciliationJob()
      await job.start()

      const [, , options] = mockPaymentReconciliationQueueAdd.mock.calls[0]
      expect(options.jobId).toBe('payment-reconciliation-repeatable')
    })

    it('includes a triggeredAt timestamp in the payload', async () => {
      const job = new PaymentReconciliationJob()
      await job.start()

      const [, payload] = mockPaymentReconciliationQueueAdd.mock.calls[0]
      expect(payload.triggeredAt).toBeDefined()
      expect(typeof payload.triggeredAt).toBe('string')
    })
  })

  describe('RefundStatusPollJob', () => {
    it('calls queue.add with a repeat option when start() is called', async () => {
      const job = new RefundStatusPollJob()
      await job.start()

      expect(mockRefundStatusPollQueueAdd).toHaveBeenCalledTimes(1)
      const [jobName, _payload, options] = mockRefundStatusPollQueueAdd.mock.calls[0]
      expect(jobName).toBe('refund-status-poll')
      expect(options.repeat).toBeDefined()
      expect(typeof options.repeat.every).toBe('number')
      expect(options.repeat.every).toBeGreaterThan(0)
    })

    it('uses the default 5-minute interval when env var is not set', async () => {
      const job = new RefundStatusPollJob()
      await job.start()

      const [, , options] = mockRefundStatusPollQueueAdd.mock.calls[0]
      const expectedMs = 5 * 60 * 1000
      expect(options.repeat.every).toBe(expectedMs)
    })

    it('uses the configured interval from MOMO_REFUND_POLL_INTERVAL_MS', async () => {
      process.env.MOMO_REFUND_POLL_INTERVAL_MS = '120000' // 2 minutes
      const job = new RefundStatusPollJob()
      await job.start()

      const [, , options] = mockRefundStatusPollQueueAdd.mock.calls[0]
      expect(options.repeat.every).toBe(120000)
    })

    it('sets a stable jobId for deduplication', async () => {
      const job = new RefundStatusPollJob()
      await job.start()

      const [, , options] = mockRefundStatusPollQueueAdd.mock.calls[0]
      expect(options.jobId).toBe('refund-status-poll-repeatable')
    })

    it('includes a triggeredAt timestamp in the payload', async () => {
      const job = new RefundStatusPollJob()
      await job.start()

      const [, payload] = mockRefundStatusPollQueueAdd.mock.calls[0]
      expect(payload.triggeredAt).toBeDefined()
      expect(typeof payload.triggeredAt).toBe('string')
    })
  })
})
