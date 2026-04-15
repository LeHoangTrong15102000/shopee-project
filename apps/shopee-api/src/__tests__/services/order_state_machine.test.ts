/// <reference types="jest" />

import { ORDER_STATUS } from '@database/models/order.model'
import { ORDER_EVENT } from '../../services/order/order_constants'
import {
  isValidTransition,
  getValidNextStates,
  validateStatusTransition,
  validateReturnDeadline,
} from '../../services/order/order_state_machine'

describe('Order State Machine', () => {
  describe('isValidTransition', () => {
    it('should return true for valid transitions', () => {
      expect(isValidTransition(ORDER_STATUS.PENDING, ORDER_EVENT.CONFIRM)).toBe(true)
      expect(isValidTransition(ORDER_STATUS.PENDING, ORDER_EVENT.CANCEL)).toBe(true)
      expect(isValidTransition(ORDER_STATUS.CONFIRMED, ORDER_EVENT.PROCESS)).toBe(true)
      expect(isValidTransition(ORDER_STATUS.CONFIRMED, ORDER_EVENT.CANCEL)).toBe(true)
      expect(isValidTransition(ORDER_STATUS.PROCESSING, ORDER_EVENT.SHIP)).toBe(true)
      expect(isValidTransition(ORDER_STATUS.PROCESSING, ORDER_EVENT.CANCEL)).toBe(true)
      expect(isValidTransition(ORDER_STATUS.SHIPPING, ORDER_EVENT.DELIVER)).toBe(true)
      expect(isValidTransition(ORDER_STATUS.DELIVERED, ORDER_EVENT.RETURN)).toBe(true)
    })

    it('should return false for invalid transitions', () => {
      expect(isValidTransition(ORDER_STATUS.PENDING, ORDER_EVENT.SHIP)).toBe(false)
      expect(isValidTransition(ORDER_STATUS.PENDING, ORDER_EVENT.DELIVER)).toBe(false)
      expect(isValidTransition(ORDER_STATUS.CONFIRMED, ORDER_EVENT.SHIP)).toBe(false)
      expect(isValidTransition(ORDER_STATUS.SHIPPING, ORDER_EVENT.CANCEL)).toBe(false)
    })

    it('should return false for transitions from final states', () => {
      expect(isValidTransition(ORDER_STATUS.CANCELLED, ORDER_EVENT.CONFIRM)).toBe(false)
      expect(isValidTransition(ORDER_STATUS.CANCELLED, ORDER_EVENT.PROCESS)).toBe(false)
      expect(isValidTransition(ORDER_STATUS.RETURNED, ORDER_EVENT.CONFIRM)).toBe(false)
      expect(isValidTransition(ORDER_STATUS.RETURNED, ORDER_EVENT.SHIP)).toBe(false)
    })
  })

  describe('getValidNextStates', () => {
    it('should return 2 next states from PENDING (confirm, cancel)', () => {
      const nextStates = getValidNextStates(ORDER_STATUS.PENDING)
      expect(nextStates).toHaveLength(2)
    })

    it('should return 2 next states from CONFIRMED (process, cancel)', () => {
      const nextStates = getValidNextStates(ORDER_STATUS.CONFIRMED)
      expect(nextStates).toHaveLength(2)
    })

    it('should return 2 next states from PROCESSING (ship, cancel)', () => {
      const nextStates = getValidNextStates(ORDER_STATUS.PROCESSING)
      expect(nextStates).toHaveLength(2)
    })

    it('should return 1 next state from SHIPPING (deliver)', () => {
      const nextStates = getValidNextStates(ORDER_STATUS.SHIPPING)
      expect(nextStates).toHaveLength(1)
    })

    it('should return 1 next state from DELIVERED (return)', () => {
      const nextStates = getValidNextStates(ORDER_STATUS.DELIVERED)
      expect(nextStates).toHaveLength(1)
    })

    it('should return empty array for final states', () => {
      expect(getValidNextStates(ORDER_STATUS.CANCELLED)).toEqual([])
      expect(getValidNextStates(ORDER_STATUS.RETURNED)).toEqual([])
    })
  })

  describe('validateStatusTransition', () => {
    it('should allow valid admin transition', () => {
      const result = validateStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, 'admin')
      expect(result.valid).toBe(true)
    })

    it('should allow valid user cancel from PENDING', () => {
      const result = validateStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.CANCELLED, 'user')
      expect(result.valid).toBe(true)
    })

    it('should reject user CONFIRM without permission', () => {
      const result = validateStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, 'user')
      expect(result.valid).toBe(false)
      expect(result.message).toBeDefined()
    })

    it('should reject invalid transition', () => {
      const result = validateStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.DELIVERED, 'admin')
      expect(result.valid).toBe(false)
      expect(result.message).toBeDefined()
    })

    it('should reject cancel from PROCESSING without reason', () => {
      const result = validateStatusTransition(
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.CANCELLED,
        'admin',
      )
      expect(result.valid).toBe(false)
      expect(result.message).toBeDefined()
    })

    it('should allow cancel from PROCESSING with reason', () => {
      const result = validateStatusTransition(
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.CANCELLED,
        'admin',
        { cancelReason: 'Out of stock' },
      )
      expect(result.valid).toBe(true)
    })

    it('should reject return without reason', () => {
      const result = validateStatusTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.RETURNED, 'user')
      expect(result.valid).toBe(false)
      expect(result.message).toBeDefined()
    })

    it('should allow return with reason', () => {
      const result = validateStatusTransition(
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.RETURNED,
        'user',
        { returnReason: 'Defective product' },
      )
      expect(result.valid).toBe(true)
    })

    it('should reject invalid target state', () => {
      const result = validateStatusTransition(ORDER_STATUS.PENDING, 'INVALID_STATE' as any, 'admin')
      expect(result.valid).toBe(false)
    })
  })

  describe('validateReturnDeadline', () => {
    it('should always allow admin returns', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 30)

      const result = validateReturnDeadline(oldDate, 'admin')
      expect(result.valid).toBe(true)
    })

    it('should allow user return within 7 days', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 5)

      const result = validateReturnDeadline(recentDate, 'user')
      expect(result.valid).toBe(true)
    })

    it('should reject user return after 7 days', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10)

      const result = validateReturnDeadline(oldDate, 'user')
      expect(result.valid).toBe(false)
      expect(result.message).toBeDefined()
    })

    it('should reject when deliveredAt is not provided', () => {
      const result = validateReturnDeadline(null as any, 'user')
      expect(result.valid).toBe(false)
      expect(result.message).toBeDefined()
    })
  })
})
