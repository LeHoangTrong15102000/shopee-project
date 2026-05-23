/**
 * Unit tests for @OnEvent decorator and registerEventHandlers utility.
 */

/// <reference types="jest" />
import { OnEvent, registerEventHandlers } from '../../events/on-event.decorator'
import { EventBus } from '../../events/event-bus'
import { DomainEvent } from '../../events/domain-events'

describe('@OnEvent decorator and registerEventHandlers', () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
  })

  it('registers a decorated method as a listener on the event bus', () => {
    const received: DomainEvent[] = []

    class TestListener {
      @OnEvent('user.registered')
      handleUserRegistered(event: DomainEvent) {
        received.push(event)
      }
    }

    const listener = new TestListener()
    registerEventHandlers(listener, eventBus)

    const event: DomainEvent = {
      type: 'user.registered',
      payload: { userId: 'u1', email: 'a@b.com', registeredAt: new Date() },
    }
    eventBus.emit(event)

    expect(received).toHaveLength(1)
    expect(received[0]).toBe(event)
  })

  it('registers multiple decorated methods on the same instance', () => {
    const orderCreatedCalls: DomainEvent[] = []
    const orderCancelledCalls: DomainEvent[] = []

    class MultiListener {
      @OnEvent('order.created')
      onCreated(event: DomainEvent) {
        orderCreatedCalls.push(event)
      }

      @OnEvent('order.cancelled')
      onCancelled(event: DomainEvent) {
        orderCancelledCalls.push(event)
      }
    }

    const listener = new MultiListener()
    registerEventHandlers(listener, eventBus)

    const createdEvent: DomainEvent = {
      type: 'order.created',
      payload: { orderId: 'o1', userId: 'u1', totalAmount: 100, items: [] },
    }
    const cancelledEvent: DomainEvent = {
      type: 'order.cancelled',
      payload: { orderId: 'o1', userId: 'u1' },
    }

    eventBus.emit(createdEvent)
    eventBus.emit(cancelledEvent)

    expect(orderCreatedCalls).toHaveLength(1)
    expect(orderCancelledCalls).toHaveLength(1)
  })

  it('does not register non-decorated methods', () => {
    const decoratedCalls: DomainEvent[] = []
    const plainCalls: DomainEvent[] = []

    class MixedListener {
      @OnEvent('user.registered')
      decorated(event: DomainEvent) {
        decoratedCalls.push(event)
      }

      plain(event: DomainEvent) {
        plainCalls.push(event)
      }
    }

    const listener = new MixedListener()
    registerEventHandlers(listener, eventBus)

    eventBus.emit({
      type: 'user.registered',
      payload: { userId: 'u1', email: 'a@b.com', registeredAt: new Date() },
    })

    expect(decoratedCalls).toHaveLength(1)
    // plain() was never registered — it should not have been called
    expect(plainCalls).toHaveLength(0)
  })

  it('binds the handler to the instance so `this` is correct', () => {
    let capturedThis: unknown = null

    class BoundListener {
      readonly id = 'listener-instance'

      @OnEvent('user.login')
      onLogin(_event: DomainEvent) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        capturedThis = this
      }
    }

    const listener = new BoundListener()
    registerEventHandlers(listener, eventBus)

    eventBus.emit({
      type: 'user.login',
      payload: { userId: 'u1', email: 'a@b.com', loginAt: new Date() },
    })

    expect(capturedThis).toBe(listener)
  })

  it('does nothing when the class has no decorated methods', () => {
    class EmptyListener {
      someMethod() {}
    }

    const listener = new EmptyListener()
    // Should not throw
    expect(() => registerEventHandlers(listener, eventBus)).not.toThrow()

    // Emitting an event should not cause errors
    expect(() => {
      eventBus.emit({
        type: 'user.registered',
        payload: { userId: 'u1', email: 'a@b.com', registeredAt: new Date() },
      })
    }).not.toThrow()
  })
})
