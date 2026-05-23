/**
 * EventBus — in-process typed domain event bus.
 *
 * Wraps Node.js EventEmitter with typed methods.
 * Each listener call is wrapped in try/catch so one failing listener
 * does not block others.
 */
import { EventEmitter } from 'events'
import { DomainEvent, DomainEventType } from './domain-events'
import { Logger } from '@utils/logger'

type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>

export class EventBus {
  private readonly emitter: EventEmitter

  constructor() {
    this.emitter = new EventEmitter()
    // Increase max listeners to avoid Node.js warnings with many event types
    this.emitter.setMaxListeners(50)
  }

  /**
   * Emit a domain event. All registered listeners for the event type are called.
   * Each listener is wrapped in try/catch — a failing listener does not block others.
   */
  emit(event: DomainEvent): void {
    const listeners = this.emitter.rawListeners(event.type) as Array<(e: DomainEvent) => void>

    for (const listener of listeners) {
      try {
        const result = listener(event)
        // Handle async listeners — catch promise rejections.
        // Cast through unknown to avoid TS1345 (void cannot be tested for truthiness).
        const maybePromise = result as unknown
        if (maybePromise !== null && maybePromise !== undefined && typeof (maybePromise as Promise<void>).catch === 'function') {
          (maybePromise as Promise<void>).catch((err) => {
            Logger.apiError('[EventBus] Async listener error', {
              eventType: event.type,
              error: err?.message,
            })
          })
        }
      } catch (err: any) {
        Logger.apiError('[EventBus] Listener error', {
          eventType: event.type,
          error: err?.message,
        })
      }
    }
  }

  /**
   * Register a listener for a specific event type.
   */
  on<T extends DomainEvent>(
    eventName: T['type'],
    handler: EventHandler<T>,
  ): void {
    this.emitter.on(eventName, handler as EventHandler)
  }

  /**
   * Remove a listener for a specific event type.
   */
  off<T extends DomainEvent>(
    eventName: T['type'],
    handler: EventHandler<T>,
  ): void {
    this.emitter.off(eventName, handler as EventHandler)
  }

  /**
   * Remove all listeners. Useful for test teardown.
   */
  removeAllListeners(eventName?: DomainEventType): void {
    if (eventName) {
      this.emitter.removeAllListeners(eventName)
    } else {
      this.emitter.removeAllListeners()
    }
  }
}
