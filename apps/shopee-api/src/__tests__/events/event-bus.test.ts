/**
 * Unit tests for EventBus.
 */

/// <reference types="jest" />
import { EventBus } from '../../events/event-bus'
import { DomainEvent } from '../../events/domain-events'

describe('EventBus', () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
  })

  it('dispatches an event to a registered listener', () => {
    const handler = jest.fn()
    eventBus.on('user.registered', handler)

    const event: DomainEvent = {
      type: 'user.registered',
      payload: { userId: 'u1', email: 'a@b.com', registeredAt: new Date() },
    }
    eventBus.emit(event)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('dispatches to multiple listeners for the same event', () => {
    const h1 = jest.fn()
    const h2 = jest.fn()
    eventBus.on('order.created', h1)
    eventBus.on('order.created', h2)

    const event: DomainEvent = {
      type: 'order.created',
      payload: { orderId: 'o1', userId: 'u1', totalAmount: 100, items: [] },
    }
    eventBus.emit(event)

    expect(h1).toHaveBeenCalledTimes(1)
    expect(h2).toHaveBeenCalledTimes(1)
  })

  it('does not call listeners for a different event type', () => {
    const handler = jest.fn()
    eventBus.on('order.created', handler)

    const event: DomainEvent = {
      type: 'user.registered',
      payload: { userId: 'u1', email: 'a@b.com', registeredAt: new Date() },
    }
    eventBus.emit(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('is a no-op when no listeners are registered', () => {
    expect(() => {
      eventBus.emit({
        type: 'user.registered',
        payload: { userId: 'u1', email: 'a@b.com', registeredAt: new Date() },
      })
    }).not.toThrow()
  })

  it('catches a synchronous listener error and does not block other listeners', () => {
    const throwing = jest.fn().mockImplementation(() => {
      throw new Error('listener error')
    })
    const safe = jest.fn()

    eventBus.on('user.registered', throwing)
    eventBus.on('user.registered', safe)

    expect(() => {
      eventBus.emit({
        type: 'user.registered',
        payload: { userId: 'u1', email: 'a@b.com', registeredAt: new Date() },
      })
    }).not.toThrow()

    expect(throwing).toHaveBeenCalledTimes(1)
    expect(safe).toHaveBeenCalledTimes(1)
  })

  it('removes a listener with off()', () => {
    const handler = jest.fn()
    eventBus.on('user.registered', handler)
    eventBus.off('user.registered', handler)

    eventBus.emit({
      type: 'user.registered',
      payload: { userId: 'u1', email: 'a@b.com', registeredAt: new Date() },
    })

    expect(handler).not.toHaveBeenCalled()
  })
})
