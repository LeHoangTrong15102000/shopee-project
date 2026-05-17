import { createMachine } from 'xstate'
import { ORDER_STATUS } from '@database/models/order.model'
import {
  ORDER_EVENT,
  EVENT_TO_STATUS,
  STATUS_TO_EVENT,
  ROLE_PERMISSIONS,
  RETURN_DEADLINE_DAYS,
  OrderEventType,
} from './order_constants'
import { OrderModel } from '@database/models/order.model'
import mongoose from 'mongoose'

/**
 * XState v5 state machine for order lifecycle
 * States: pending, payment_pending, payment_failed, confirmed, processing, shipping, delivered, cancelled, returned
 * Events: CONFIRM, PROCESS, SHIP, DELIVER, CANCEL, RETURN, INITIATE_PAYMENT, PAYMENT_SUCCESS, PAYMENT_FAIL, RETRY_PAYMENT
 */
export const orderStateMachine = createMachine({
  id: 'order',
  initial: ORDER_STATUS.PENDING,
  states: {
    [ORDER_STATUS.PENDING]: {
      on: {
        [ORDER_EVENT.CONFIRM]: ORDER_STATUS.CONFIRMED,
        [ORDER_EVENT.CANCEL]: ORDER_STATUS.CANCELLED,
        [ORDER_EVENT.INITIATE_PAYMENT]: ORDER_STATUS.PAYMENT_PENDING,
      },
    },
    [ORDER_STATUS.PAYMENT_PENDING]: {
      on: {
        [ORDER_EVENT.PAYMENT_SUCCESS]: ORDER_STATUS.CONFIRMED,
        [ORDER_EVENT.PAYMENT_FAIL]: ORDER_STATUS.PAYMENT_FAILED,
        [ORDER_EVENT.CANCEL]: ORDER_STATUS.CANCELLED,
      },
    },
    [ORDER_STATUS.PAYMENT_FAILED]: {
      on: {
        [ORDER_EVENT.RETRY_PAYMENT]: ORDER_STATUS.PAYMENT_PENDING,
        [ORDER_EVENT.INITIATE_PAYMENT]: ORDER_STATUS.PAYMENT_PENDING,
        [ORDER_EVENT.CANCEL]: ORDER_STATUS.CANCELLED,
      },
    },
    [ORDER_STATUS.CONFIRMED]: {
      on: {
        [ORDER_EVENT.PROCESS]: ORDER_STATUS.PROCESSING,
        [ORDER_EVENT.CANCEL]: ORDER_STATUS.CANCELLED,
      },
    },
    [ORDER_STATUS.PROCESSING]: {
      on: {
        [ORDER_EVENT.SHIP]: ORDER_STATUS.SHIPPING,
        [ORDER_EVENT.CANCEL]: ORDER_STATUS.CANCELLED,
      },
    },
    [ORDER_STATUS.SHIPPING]: {
      on: {
        [ORDER_EVENT.DELIVER]: ORDER_STATUS.DELIVERED,
      },
    },
    [ORDER_STATUS.DELIVERED]: {
      on: {
        [ORDER_EVENT.RETURN]: ORDER_STATUS.RETURNED,
      },
    },
    [ORDER_STATUS.CANCELLED]: {
      type: 'final',
    },
    [ORDER_STATUS.RETURNED]: {
      type: 'final',
    },
  },
})

/**
 * Check if a transition is valid for the given event from current state
 */
export function isValidTransition(currentState: string, event: string): boolean {
  const stateNode = orderStateMachine.states[currentState]
  if (!stateNode || !stateNode.on) return false
  return Object.keys(stateNode.on).includes(event)
}

/**
 * Get all valid target states from the current state
 */
export function getValidNextStates(currentState: string): string[] {
  const stateNode = orderStateMachine.states[currentState]
  if (!stateNode || !stateNode.on) return []
  return Object.values(stateNode.on).map((t: any) => (typeof t === 'string' ? t : t.target))
}

/**
 * Validate a status transition with role permissions and business rules
 */
export function validateStatusTransition(
  currentState: string,
  targetState: string,
  role: 'user' | 'admin',
  options?: { cancelReason?: string; returnReason?: string },
): { valid: boolean; message?: string } {
  // Resolve the event for this target state
  const event = STATUS_TO_EVENT[targetState] as OrderEventType | undefined
  if (!event) {
    return { valid: false, message: `Trạng thái '${targetState}' không hợp lệ` }
  }

  // Check if the transition is valid in the state machine
  if (!isValidTransition(currentState, event)) {
    const validStates = getValidNextStates(currentState)
    return {
      valid: false,
      message: `Không thể chuyển từ '${currentState}' sang '${targetState}'. Các trạng thái hợp lệ: ${validStates.join(', ') || 'không có'}`,
    }
  }

  // Check role permissions
  const allowedEvents = ROLE_PERMISSIONS[role]
  if (!allowedEvents.includes(event)) {
    return { valid: false, message: 'Chỉ admin mới có thể thực hiện hành động này' }
  }

  // Business rules: cancel reason required from processing
  if (targetState === ORDER_STATUS.CANCELLED && currentState === ORDER_STATUS.PROCESSING) {
    if (!options?.cancelReason) {
      return { valid: false, message: 'Cần cung cấp lý do hủy đơn hàng đang xử lý' }
    }
  }

  // Business rules: return reason always required
  if (targetState === ORDER_STATUS.RETURNED) {
    if (!options?.returnReason) {
      return { valid: false, message: 'Cần cung cấp lý do trả hàng' }
    }
  }

  return { valid: true }
}

/**
 * Validate return deadline (7 days from delivered_at)
 * Admin bypasses the deadline check
 */
export function validateReturnDeadline(
  deliveredAt: Date | undefined,
  role: 'user' | 'admin',
): { valid: boolean; message?: string } {
  if (role === 'admin') return { valid: true }

  if (!deliveredAt) {
    return { valid: false, message: 'Không tìm thấy thời gian giao hàng' }
  }

  const deadlineMs = RETURN_DEADLINE_DAYS * 24 * 60 * 60 * 1000
  const now = new Date().getTime()
  const deliveredTime = new Date(deliveredAt).getTime()

  if (now - deliveredTime > deadlineMs) {
    return {
      valid: false,
      message: `Đã quá thời hạn trả hàng (${RETURN_DEADLINE_DAYS} ngày kể từ khi nhận hàng)`,
    }
  }

  return { valid: true }
}

export interface TransitionOrderPaymentStatusOptions {
  session?: mongoose.ClientSession
  extraUpdate?: Record<string, unknown>
}

export interface TransitionOrderPaymentStatusResult {
  success: boolean
  newStatus?: string
  message?: string
}

/**
 * Validate and apply a payment state transition for an order.
 * Reads current order status, validates via isValidTransition(), then writes to DB.
 * Returns { success: true, newStatus } on valid transition.
 * Returns { success: false, message } on invalid transition or missing order — never throws.
 */
export async function transitionOrderPaymentStatus(
  orderId: string | null | undefined,
  event: string,
  options?: TransitionOrderPaymentStatusOptions,
): Promise<TransitionOrderPaymentStatusResult> {
  // Guard: null/undefined/empty orderId — skip DB query
  if (!orderId || orderId.trim() === '') {
    return { success: false, message: 'Invalid orderId' }
  }

  const order = await OrderModel.findById(orderId).select('status').lean()
  if (!order) {
    return { success: false, message: `Order not found: ${orderId}` }
  }

  const currentStatus = order.status as string
  if (!isValidTransition(currentStatus, event)) {
    return {
      success: false,
      message: `Invalid transition from ${currentStatus} via ${event}`,
    }
  }

  const newStatus = EVENT_TO_STATUS[event as OrderEventType]

  const updateFields: Record<string, unknown> = {
    status: newStatus,
    ...(options?.extraUpdate ?? {}),
  }

  const query = OrderModel.findByIdAndUpdate(orderId, updateFields)
  if (options?.session) {
    query.session(options.session)
  }
  await query

  return { success: true, newStatus }
}
