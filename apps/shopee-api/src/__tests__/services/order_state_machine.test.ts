/// <reference types="jest" />

import { ORDER_STATUS } from '@database/models/order.model'
import { ORDER_EVENT } from '../../services/order/order_constants'
import {
  isValidTransition,
  getValidNextStates,
  validateStatusTransition,
  validateReturnDeadline,
  transitionOrderPaymentStatus,
} from '../../services/order/order_state_machine'

// ─── Mock OrderModel for transitionOrderPaymentStatus tests ───────────────────

jest.mock('@database/models/order.model', () => {
  const actual = jest.requireActual('@database/models/order.model')
  return {
    ...actual,
    OrderModel: {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    },
  }
})

import { OrderModel } from '@database/models/order.model'
const mockOrderModel = OrderModel as jest.Mocked<typeof OrderModel>

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
    it('should return 3 next states from PENDING (confirm, cancel, initiate_payment)', () => {
      const nextStates = getValidNextStates(ORDER_STATUS.PENDING)
      expect(nextStates).toHaveLength(3)
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

// ─── Payment state machine transitions ────────────────────────────────────────

describe('Payment state machine transitions', () => {
  describe('payment_pending state', () => {
    it('should allow PAYMENT_SUCCESS from payment_pending', () => {
      expect(isValidTransition(ORDER_STATUS.PAYMENT_PENDING, ORDER_EVENT.PAYMENT_SUCCESS)).toBe(
        true,
      )
    })

    it('should allow PAYMENT_FAIL from payment_pending', () => {
      expect(isValidTransition(ORDER_STATUS.PAYMENT_PENDING, ORDER_EVENT.PAYMENT_FAIL)).toBe(true)
    })

    it('should allow CANCEL from payment_pending', () => {
      expect(isValidTransition(ORDER_STATUS.PAYMENT_PENDING, ORDER_EVENT.CANCEL)).toBe(true)
    })

    it('should reject CONFIRM from payment_pending', () => {
      expect(isValidTransition(ORDER_STATUS.PAYMENT_PENDING, ORDER_EVENT.CONFIRM)).toBe(false)
    })
  })

  describe('payment_failed state', () => {
    it('should allow RETRY_PAYMENT from payment_failed', () => {
      expect(isValidTransition(ORDER_STATUS.PAYMENT_FAILED, ORDER_EVENT.RETRY_PAYMENT)).toBe(true)
    })

    it('should allow INITIATE_PAYMENT from payment_failed', () => {
      expect(isValidTransition(ORDER_STATUS.PAYMENT_FAILED, ORDER_EVENT.INITIATE_PAYMENT)).toBe(
        true,
      )
    })

    it('should allow CANCEL from payment_failed', () => {
      expect(isValidTransition(ORDER_STATUS.PAYMENT_FAILED, ORDER_EVENT.CANCEL)).toBe(true)
    })

    it('should reject CONFIRM from payment_failed', () => {
      expect(isValidTransition(ORDER_STATUS.PAYMENT_FAILED, ORDER_EVENT.CONFIRM)).toBe(false)
    })
  })

  describe('pending → INITIATE_PAYMENT → payment_pending', () => {
    it('should allow INITIATE_PAYMENT from pending', () => {
      expect(isValidTransition(ORDER_STATUS.PENDING, ORDER_EVENT.INITIATE_PAYMENT)).toBe(true)
    })

    it('should still allow CONFIRM from pending (COD orders)', () => {
      expect(isValidTransition(ORDER_STATUS.PENDING, ORDER_EVENT.CONFIRM)).toBe(true)
    })

    it('should still allow CANCEL from pending', () => {
      expect(isValidTransition(ORDER_STATUS.PENDING, ORDER_EVENT.CANCEL)).toBe(true)
    })
  })
})

// ─── transitionOrderPaymentStatus helper ──────────────────────────────────────

describe('transitionOrderPaymentStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns failure for null orderId without DB query', async () => {
    const result = await transitionOrderPaymentStatus(null, 'PAYMENT_SUCCESS')
    expect(result.success).toBe(false)
    expect(result.message).toBe('Invalid orderId')
    expect(mockOrderModel.findById).not.toHaveBeenCalled()
  })

  it('returns failure for undefined orderId without DB query', async () => {
    const result = await transitionOrderPaymentStatus(undefined, 'PAYMENT_SUCCESS')
    expect(result.success).toBe(false)
    expect(result.message).toBe('Invalid orderId')
    expect(mockOrderModel.findById).not.toHaveBeenCalled()
  })

  it('returns failure for empty string orderId without DB query', async () => {
    const result = await transitionOrderPaymentStatus('', 'PAYMENT_SUCCESS')
    expect(result.success).toBe(false)
    expect(result.message).toBe('Invalid orderId')
    expect(mockOrderModel.findById).not.toHaveBeenCalled()
  })

  it('returns failure when order is not found', async () => {
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    })

    const result = await transitionOrderPaymentStatus('nonexistent-id', 'PAYMENT_SUCCESS')
    expect(result.success).toBe(false)
    expect(result.message).toBe('Order not found: nonexistent-id')
    expect(mockOrderModel.findByIdAndUpdate).not.toHaveBeenCalled()
  })

  it('returns failure for invalid transition', async () => {
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ status: ORDER_STATUS.DELIVERED }),
      }),
    })

    const result = await transitionOrderPaymentStatus('order-id', 'PAYMENT_SUCCESS')
    expect(result.success).toBe(false)
    expect(result.message).toContain('Invalid transition from delivered via PAYMENT_SUCCESS')
    expect(mockOrderModel.findByIdAndUpdate).not.toHaveBeenCalled()
  })

  it('returns success and newStatus for valid transition', async () => {
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ status: ORDER_STATUS.PAYMENT_PENDING }),
      }),
    })
    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
      session: jest.fn().mockResolvedValue(undefined),
    })
    // findByIdAndUpdate without session returns a thenable
    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue(Promise.resolve(undefined))

    const result = await transitionOrderPaymentStatus('order-id', 'PAYMENT_SUCCESS')
    expect(result.success).toBe(true)
    expect(result.newStatus).toBe(ORDER_STATUS.CONFIRMED)
    expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'order-id',
      expect.objectContaining({ status: ORDER_STATUS.CONFIRMED }),
    )
  })

  it('passes session to findByIdAndUpdate when provided', async () => {
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ status: ORDER_STATUS.PAYMENT_PENDING }),
      }),
    })

    const mockSessionQuery = { session: jest.fn().mockResolvedValue(undefined) }
    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockSessionQuery)

    const fakeSession = {} as any
    await transitionOrderPaymentStatus('order-id', 'PAYMENT_SUCCESS', { session: fakeSession })

    expect(mockSessionQuery.session).toHaveBeenCalledWith(fakeSession)
  })

  it('merges extraUpdate fields into the update object', async () => {
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ status: ORDER_STATUS.PAYMENT_PENDING }),
      }),
    })
    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue(Promise.resolve(undefined))

    const confirmedAt = new Date()
    await transitionOrderPaymentStatus('order-id', 'PAYMENT_SUCCESS', {
      extraUpdate: { payment_status: 'paid', confirmed_at: confirmedAt },
    })

    expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'order-id',
      expect.objectContaining({
        status: ORDER_STATUS.CONFIRMED,
        payment_status: 'paid',
        confirmed_at: confirmedAt,
      }),
    )
  })
})
