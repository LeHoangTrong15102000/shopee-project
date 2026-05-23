/**
 * @OnEvent decorator and registerEventHandlers utility.
 *
 * @OnEvent(eventName) stores the event name as metadata on the method.
 * registerEventHandlers(instance, eventBus) reads the metadata and registers
 * all decorated methods as event listeners.
 *
 * This mirrors NestJS's @OnEvent() pattern without the framework dependency.
 * Uses a WeakMap to store metadata without requiring reflect-metadata.
 */
import { EventBus } from './event-bus'
import { DomainEventType } from './domain-events'

/**
 * Metadata stored on each decorated method.
 */
interface OnEventMetadata {
  eventName: DomainEventType
  methodName: string
}

/**
 * WeakMap keyed by prototype object, value is array of event metadata.
 * This avoids the need for reflect-metadata.
 */
const eventMetadataMap = new WeakMap<object, OnEventMetadata[]>()

/**
 * @OnEvent(eventName) — decorator that marks a method as an event handler.
 * The event name is stored as metadata on the class prototype.
 */
export function OnEvent(eventName: DomainEventType): MethodDecorator {
  return (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) => {
    const existing: OnEventMetadata[] = eventMetadataMap.get(target) ?? []
    existing.push({ eventName, methodName: propertyKey as string })
    eventMetadataMap.set(target, existing)
  }
}

/**
 * registerEventHandlers(instance, eventBus) — reads @OnEvent metadata from
 * the instance's prototype and registers each decorated method as a listener
 * on the provided EventBus.
 */
export function registerEventHandlers(instance: object, eventBus: EventBus): void {
  const proto = Object.getPrototypeOf(instance)
  const metadata: OnEventMetadata[] = eventMetadataMap.get(proto) ?? []

  for (const { eventName, methodName } of metadata) {
    const handler = (instance as Record<string, unknown>)[methodName]
    if (typeof handler === 'function') {
      eventBus.on(eventName, handler.bind(instance))
    }
  }
}
