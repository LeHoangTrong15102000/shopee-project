import { ORDER_STATUS } from '@database/models/order.model'

/**
 * Order event names (action verbs)
 */
export const ORDER_EVENT = {
  CONFIRM: 'CONFIRM',
  PROCESS: 'PROCESS',
  SHIP: 'SHIP',
  DELIVER: 'DELIVER',
  CANCEL: 'CANCEL',
  RETURN: 'RETURN',
} as const

export type OrderEventType = (typeof ORDER_EVENT)[keyof typeof ORDER_EVENT]

/**
 * Event-to-status mapping: which status results from each event
 */
export const EVENT_TO_STATUS: Record<OrderEventType, string> = {
  [ORDER_EVENT.CONFIRM]: ORDER_STATUS.CONFIRMED,
  [ORDER_EVENT.PROCESS]: ORDER_STATUS.PROCESSING,
  [ORDER_EVENT.SHIP]: ORDER_STATUS.SHIPPING,
  [ORDER_EVENT.DELIVER]: ORDER_STATUS.DELIVERED,
  [ORDER_EVENT.CANCEL]: ORDER_STATUS.CANCELLED,
  [ORDER_EVENT.RETURN]: ORDER_STATUS.RETURNED,
}

/**
 * Status-to-event mapping: which event leads to each status
 */
export const STATUS_TO_EVENT: Record<string, OrderEventType> = {
  [ORDER_STATUS.CONFIRMED]: ORDER_EVENT.CONFIRM,
  [ORDER_STATUS.PROCESSING]: ORDER_EVENT.PROCESS,
  [ORDER_STATUS.SHIPPING]: ORDER_EVENT.SHIP,
  [ORDER_STATUS.DELIVERED]: ORDER_EVENT.DELIVER,
  [ORDER_STATUS.CANCELLED]: ORDER_EVENT.CANCEL,
  [ORDER_STATUS.RETURNED]: ORDER_EVENT.RETURN,
}

/**
 * Role permission matrix
 * Defines which events each role can trigger
 */
export const ROLE_PERMISSIONS: Record<'user' | 'admin', OrderEventType[]> = {
  user: [ORDER_EVENT.CANCEL, ORDER_EVENT.RETURN, ORDER_EVENT.DELIVER],
  admin: [
    ORDER_EVENT.CONFIRM,
    ORDER_EVENT.PROCESS,
    ORDER_EVENT.SHIP,
    ORDER_EVENT.DELIVER,
    ORDER_EVENT.CANCEL,
    ORDER_EVENT.RETURN,
  ],
}

/**
 * Return deadline in days
 */
export const RETURN_DEADLINE_DAYS = 7

