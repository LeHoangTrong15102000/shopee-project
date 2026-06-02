/**
 * Unit tests for OrderEventListener.
 */

/// <reference types="jest" />
import { OrderEventListener } from '../../events/listeners/order.listener'
import { DomainEvent } from '../../events/domain-events'

// Minimal Queue mock — only the `add` method is needed
const makeQueueMock = () => ({ add: jest.fn().mockResolvedValue({ id: 'job-1' }) })

describe('OrderEventListener', () => {
  let emailQueue: ReturnType<typeof makeQueueMock>
  let notificationQueue: ReturnType<typeof makeQueueMock>
  let listener: OrderEventListener

  beforeEach(() => {
    emailQueue = makeQueueMock()
    notificationQueue = makeQueueMock()
    listener = new OrderEventListener(emailQueue as any, notificationQueue as any)
    jest.clearAllMocks()
  })

  describe('onOrderCreated (order.created)', () => {
    const event: Extract<DomainEvent, { type: 'order.created' }> = {
      type: 'order.created',
      payload: { orderId: 'order-123', userId: 'user-456', totalAmount: 250, items: [] },
    }

    it('enqueues an email job with the correct payload', async () => {
      await listener.onOrderCreated(event)

      expect(emailQueue.add).toHaveBeenCalledTimes(1)
      const [jobName, payload] = emailQueue.add.mock.calls[0]
      expect(jobName).toBe('order-confirmation')
      expect(payload).toMatchObject({
        to: 'user-456',
        subject: 'Order Confirmation',
        data: { orderId: 'order-123', totalAmount: 250 },
      })
    })

    it('enqueues a notification job with the correct payload', async () => {
      await listener.onOrderCreated(event)

      expect(notificationQueue.add).toHaveBeenCalledTimes(1)
      const [jobName, payload] = notificationQueue.add.mock.calls[0]
      expect(jobName).toBe('order-created-notification')
      expect(payload).toMatchObject({
        userId: 'user-456',
        type: 'order',
        link: '/orders/order-123',
      })
      expect(payload.title).toBeTruthy()
      expect(payload.content).toContain('order-123')
    })

    it('enqueues both email and notification jobs', async () => {
      await listener.onOrderCreated(event)

      expect(emailQueue.add).toHaveBeenCalledTimes(1)
      expect(notificationQueue.add).toHaveBeenCalledTimes(1)
    })
  })

  describe('onOrderStatusChanged (order.status_changed)', () => {
    const event: Extract<DomainEvent, { type: 'order.status_changed' }> = {
      type: 'order.status_changed',
      payload: {
        orderId: 'order-123',
        userId: 'user-456',
        newStatus: 'SHIPPED',
        previousStatus: 'PENDING',
      },
    }

    it('enqueues a notification job with the new status', async () => {
      await listener.onOrderStatusChanged(event)

      expect(notificationQueue.add).toHaveBeenCalledTimes(1)
      const [jobName, payload] = notificationQueue.add.mock.calls[0]
      expect(jobName).toBe('order-status-notification')
      expect(payload).toMatchObject({
        userId: 'user-456',
        type: 'order',
        link: '/orders/order-123',
      })
      expect(payload.content).toContain('SHIPPED')
    })

    it('does not enqueue an email job', async () => {
      await listener.onOrderStatusChanged(event)

      expect(emailQueue.add).not.toHaveBeenCalled()
    })
  })

  describe('onOrderCancelled (order.cancelled)', () => {
    it('enqueues a notification job with the cancellation reason when provided', async () => {
      const event: Extract<DomainEvent, { type: 'order.cancelled' }> = {
        type: 'order.cancelled',
        payload: { orderId: 'order-123', userId: 'user-456', reason: 'Out of stock' },
      }

      await listener.onOrderCancelled(event)

      expect(notificationQueue.add).toHaveBeenCalledTimes(1)
      const [jobName, payload] = notificationQueue.add.mock.calls[0]
      expect(jobName).toBe('order-cancelled-notification')
      expect(payload.content).toContain('Out of stock')
    })

    it('enqueues a notification job without reason when not provided', async () => {
      const event: Extract<DomainEvent, { type: 'order.cancelled' }> = {
        type: 'order.cancelled',
        payload: { orderId: 'order-789', userId: 'user-456' },
      }

      await listener.onOrderCancelled(event)

      expect(notificationQueue.add).toHaveBeenCalledTimes(1)
      const [, payload] = notificationQueue.add.mock.calls[0]
      expect(payload.content).toContain('order-789')
      expect(payload.content).not.toContain('Reason:')
    })

    it('does not enqueue an email job', async () => {
      const event: Extract<DomainEvent, { type: 'order.cancelled' }> = {
        type: 'order.cancelled',
        payload: { orderId: 'order-123', userId: 'user-456' },
      }

      await listener.onOrderCancelled(event)

      expect(emailQueue.add).not.toHaveBeenCalled()
    })
  })
})
