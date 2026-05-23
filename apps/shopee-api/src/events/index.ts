/**
 * Events module barrel export.
 */
export { EventBus } from './event-bus'
export type { DomainEvent, DomainEventType } from './domain-events'
export { OnEvent, registerEventHandlers } from './on-event.decorator'
