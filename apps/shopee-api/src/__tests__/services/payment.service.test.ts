/// <reference types="jest" />

// ─── Mock dependencies ────────────────────────────────────────────────────────

jest.mock('@repositories/payment.repository')
jest.mock('@database/models/order.model', () => ({
  OrderModel: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
  },
  ORDER_STATUS: {
    PAYMENT_PENDING: 'payment_pending',
    CONFIRMED: 'confirmed',
    PAYMENT_FAILED: 'payment_failed',
  },
  PAYMENT_METHOD: {},
  PAYMENT_STATUS: {
    PAID: 'paid',
    FAILED: 'failed',
    PENDING: 'pending',
  },
}))

jest.mock('@database/models/payment.model', () => ({
  GATEWAY_PAYMENT_STATUS: {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
  },
}))

jest.mock('@database/models/payment-session.model', () => ({
  PaymentSessionModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  PAYMENT_SESSION_STATUS: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    EXPIRED: 'EXPIRED',
  },
}))

// Mock mongoose session/transaction
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose')
  return {
    ...actual,
    startSession: jest.fn().mockResolvedValue({
      withTransaction: jest.fn().mockImplementation(async (fn) => {
        await fn()
      }),
      endSession: jest.fn().mockResolvedValue(undefined),
    }),
    Types: actual.Types,
  }
})

// Mock socket emit
jest.mock('../../socket/utils/emit', () => ({
  emitToUser: jest.fn(),
}))

// Mock order state machine helper so payment.service tests don't need real DB
jest.mock('@services/order/order_state_machine', () => ({
  transitionOrderPaymentStatus: jest.fn().mockResolvedValue({ success: true, newStatus: 'confirmed' }),
  isValidTransition: jest.fn().mockReturnValue(true),
  getValidNextStates: jest.fn().mockReturnValue([]),
  validateStatusTransition: jest.fn(),
  validateReturnDeadline: jest.fn(),
  orderStateMachine: { states: {} },
}))

// Mock payment-metrics
jest.mock('@utils/payment-metrics', () => ({
  incrementInitiated: jest.fn(),
  incrementIpnReceived: jest.fn(),
  incrementSuccess: jest.fn(),
  incrementFailed: jest.fn(),
}))

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-v4'),
}))

// Mock Logger to suppress console output during tests
jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiWarn: jest.fn(),
    apiError: jest.fn(),
  },
}))

import { PaymentService } from '@services/payment.service'
import { PaymentRepository } from '@repositories/payment.repository'
import { OrderModel, ORDER_STATUS, PAYMENT_STATUS } from '@database/models/order.model'
import { GATEWAY_PAYMENT_STATUS } from '@database/models/payment.model'
import { PaymentSessionModel, PAYMENT_SESSION_STATUS } from '@database/models/payment-session.model'
import { PaymentProvider, IPaymentProvider } from '@services/payment/payment.interface'
import { emitToUser } from '../../socket/utils/emit'
import { transitionOrderPaymentStatus } from '@services/order/order_state_machine'
import { incrementInitiated, incrementIpnReceived, incrementSuccess, incrementFailed } from '@utils/payment-metrics'
import mongoose from 'mongoose'

const MockPaymentRepository = PaymentRepository as jest.MockedClass<typeof PaymentRepository>
const mockOrderModel = OrderModel as jest.Mocked<typeof OrderModel>
const mockPaymentSessionModel = PaymentSessionModel as jest.Mocked<typeof PaymentSessionModel>
const mockEmitToUser = emitToUser as jest.Mock
const mockIncrementInitiated = incrementInitiated as jest.Mock
const mockIncrementIpnReceived = incrementIpnReceived as jest.Mock
const mockIncrementSuccess = incrementSuccess as jest.Mock
const mockIncrementFailed = incrementFailed as jest.Mock

// ─── Mock provider factory ────────────────────────────────────────────────────

function makeMockProvider(): jest.Mocked<IPaymentProvider> {
  return {
    verifyIpn: jest.fn().mockReturnValue(true),
    parseIpnResult: jest.fn(),
    createPayment: jest.fn(),
    queryStatus: jest.fn(),
  }
}

function makeProviderMap(
  momoProvider?: jest.Mocked<IPaymentProvider>,
  vnpayProvider?: jest.Mocked<IPaymentProvider>,
): Map<PaymentProvider, IPaymentProvider> {
  return new Map<PaymentProvider, IPaymentProvider>([
    [PaymentProvider.MOMO, momoProvider ?? makeMockProvider()],
    [PaymentProvider.VNPAY, vnpayProvider ?? makeMockProvider()],
  ])
}

// ─── Mock OrderService ───────────────────────────────────────────────────────

import type { OrderService } from '@services/order.service'

function makeMockOrderService() {
  return {
    createOrderFromSession: jest.fn().mockResolvedValue({
      _id: new mongoose.Types.ObjectId('cccccccccccccccccccccccc'),
      user: 'user_001',
      total: 150000,
    }),
  } as unknown as OrderService
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePaymentRecord(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    orderId: new mongoose.Types.ObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
    sessionId: new mongoose.Types.ObjectId('dddddddddddddddddddddddd'),
    provider: PaymentProvider.MOMO,
    amount: 150000,
    status: GATEWAY_PAYMENT_STATUS.PENDING,
    ...overrides,
  }
}

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
    user: 'user_001',
    total: 150000,
    status: ORDER_STATUS.PAYMENT_PENDING,
    ...overrides,
  }
}

function makePaymentSession(overrides: Record<string, unknown> = {}) {
  const id = new mongoose.Types.ObjectId('eeeeeeeeeeeeeeeeeeeeeeee')
  return {
    _id: id,
    userId: new mongoose.Types.ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    cartItems: [
      {
        productId: new mongoose.Types.ObjectId(),
        buyCount: 1,
        price: 150000,
      },
    ],
    shippingAddressId: new mongoose.Types.ObjectId(),
    shippingMethodId: 'standard',
    paymentMethod: 'e_wallet',
    eWalletProvider: 'MOMO',
    amount: 150000,
    status: PAYMENT_SESSION_STATUS.PENDING,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    ...overrides,
  }
}

// ─── PaymentService — getProvider ────────────────────────────────────────────

describe('PaymentService — getProvider', () => {
  let service: PaymentService
  let repoInstance: jest.Mocked<PaymentRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    new MockPaymentRepository()
    repoInstance = MockPaymentRepository.mock.instances[0] as jest.Mocked<PaymentRepository>
    service = new PaymentService(repoInstance, makeProviderMap(), makeMockOrderService)
  })

  // A.2 — unsupported provider throws error
  it('should throw an error for unsupported provider', () => {
    expect(() => service.getProvider('PAYPAL' as any)).toThrow()
  })

  it('should return MomoProvider for MOMO', () => {
    const provider = service.getProvider(PaymentProvider.MOMO)
    expect(provider).toBeDefined()
  })

  it('should return VnpayProvider for VNPAY', () => {
    const provider = service.getProvider(PaymentProvider.VNPAY)
    expect(provider).toBeDefined()
  })
})

// ─── PaymentService — initiatePayment ────────────────────────────────────────

describe('PaymentService — initiatePayment', () => {
  let service: PaymentService
  let repoInstance: jest.Mocked<PaymentRepository>
  let mockMomoProvider: jest.Mocked<IPaymentProvider>

  beforeEach(() => {
    jest.clearAllMocks()
    new MockPaymentRepository()
    repoInstance = MockPaymentRepository.mock.instances[0] as jest.Mocked<PaymentRepository>
    mockMomoProvider = makeMockProvider()
    service = new PaymentService(repoInstance, makeProviderMap(mockMomoProvider), makeMockOrderService)
  })

  // A.3 — order not found
  it('should throw when order is not found', async () => {
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })

    await expect(
      service.initiatePayment('nonexistent-order-id', PaymentProvider.MOMO, '127.0.0.1'),
    ).rejects.toThrow()
  })

  // idempotency: existing PENDING payment returns early with existing URL
  it('should return existing payment URL when a PENDING payment already exists for the order', async () => {
    const orderId = 'bbbbbbbbbbbbbbbbbbbbbbbb'
    const order = makeOrder({ _id: orderId, total: 150000 })

    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(order),
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ payment_url: 'https://momo.vn/pay/existing' }),
      }),
    })

    const existingPayment = makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.PENDING })
    repoInstance.findPendingByOrderId = jest.fn().mockResolvedValue(existingPayment)

    const result = await service.initiatePayment(orderId, PaymentProvider.MOMO, '127.0.0.1')

    expect(result.paymentUrl).toBe('https://momo.vn/pay/existing')
    expect(result.paymentId).toBe(existingPayment._id.toString())
    // Provider should NOT be called again
    expect(mockMomoProvider.createPayment).not.toHaveBeenCalled()
  })

  // A.4 — provider API timeout
  it('should mark payment FAILED and propagate error on provider API timeout', async () => {
    const orderId = 'bbbbbbbbbbbbbbbbbbbbbbbb'
    const order = makeOrder({ _id: orderId, total: 150000 })

    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(order),
    })

    const paymentRecord = makePaymentRecord({ _id: new mongoose.Types.ObjectId() })
    repoInstance.findPendingByOrderId = jest.fn().mockResolvedValue(null)
    repoInstance.create = jest.fn().mockResolvedValue(paymentRecord)
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    // Mock provider to throw a timeout error
    const timeoutError = Object.assign(new Error('timeout'), { code: 'ECONNABORTED' })
    mockMomoProvider.createPayment = jest.fn().mockRejectedValue(timeoutError)

    await expect(
      service.initiatePayment(orderId, PaymentProvider.MOMO, '127.0.0.1'),
    ).rejects.toThrow()

    // Payment record should be marked FAILED
    expect(repoInstance.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: GATEWAY_PAYMENT_STATUS.FAILED }),
    )
  })
})

// ─── PaymentService — retryPayment ───────────────────────────────────────────

describe('PaymentService — retryPayment', () => {
  let service: PaymentService
  let repoInstance: jest.Mocked<PaymentRepository>
  let mockMomoProvider: jest.Mocked<IPaymentProvider>

  beforeEach(() => {
    jest.clearAllMocks()
    new MockPaymentRepository()
    repoInstance = MockPaymentRepository.mock.instances[0] as jest.Mocked<PaymentRepository>
    mockMomoProvider = makeMockProvider()
    service = new PaymentService(repoInstance, makeProviderMap(mockMomoProvider), makeMockOrderService)
  })

  // A.5 — reject retry when payment already SUCCESS
  it('should throw BadRequestException when payment is already SUCCESS', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.SUCCESS }),
    )

    await expect(
      service.retryPayment('bbbbbbbbbbbbbbbbbbbbbbbb', '127.0.0.1'),
    ).rejects.toThrow('Payment already succeeded — cannot retry')
  })

  // A.6 — generate new payment URL when payment FAILED/expired
  it('should create a new payment and return new paymentUrl when payment is FAILED', async () => {
    const orderId = 'bbbbbbbbbbbbbbbbbbbbbbbb'
    const order = makeOrder({ _id: orderId, total: 150000 })

    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.FAILED, provider: PaymentProvider.MOMO }),
    )

    // For the subsequent initiatePayment call
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(order),
    })

    const newPaymentRecord = makePaymentRecord({ _id: new mongoose.Types.ObjectId() })
    repoInstance.findPendingByOrderId = jest.fn().mockResolvedValue(null)
    repoInstance.create = jest.fn().mockResolvedValue(newPaymentRecord)
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    mockMomoProvider.createPayment = jest.fn().mockResolvedValue({
      paymentUrl: 'https://momo.vn/pay/new-url',
      requestId: 'new-req-id',
      transactionId: 'new-txn-id',
    })

    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({})

    const result = await service.retryPayment(orderId, '127.0.0.1')

    expect(result.paymentUrl).toBe('https://momo.vn/pay/new-url')
    expect(repoInstance.create).toHaveBeenCalled()
  })

  // retryPayment — no payment found for order
  it('should throw when no payment record exists for the given order', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(null)

    await expect(
      service.retryPayment('bbbbbbbbbbbbbbbbbbbbbbbb', '127.0.0.1'),
    ).rejects.toThrow('No payment found for order')
  })
})

// ─── PaymentService — getPaymentStatus ───────────────────────────────────────

describe('PaymentService — getPaymentStatus', () => {
  let service: PaymentService
  let repoInstance: jest.Mocked<PaymentRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    new MockPaymentRepository()
    repoInstance = MockPaymentRepository.mock.instances[0] as jest.Mocked<PaymentRepository>
    service = new PaymentService(repoInstance, makeProviderMap(), makeMockOrderService)
  })

  // A.7 — status PENDING (not expired)
  it('should return canRetry: false for PENDING payment that is not expired', async () => {
    const recentDate = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.PENDING, createdAt: recentDate }),
    )
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ payment_url: 'https://momo.vn/pay/xxx', status: ORDER_STATUS.PAYMENT_PENDING }),
      }),
    })

    const result = await service.getPaymentStatus('bbbbbbbbbbbbbbbbbbbbbbbb')

    expect(result.status).toBe(GATEWAY_PAYMENT_STATUS.PENDING)
    expect(result.canRetry).toBe(false)
  })

  // A.8 — status PENDING + expired (order is payment_failed)
  // NOTE: The spec describes a time-based expiry check (payment.createdAt > 15 minutes ago).
  // The actual production code in getPaymentStatus() does NOT implement time-based expiry.
  // Instead, canRetry is true when: payment.status === FAILED, OR
  // (payment.status === PENDING AND order.status === PAYMENT_FAILED).
  // This test correctly reflects the actual production code behavior.
  it('should return canRetry: true for PENDING payment when order is payment_failed', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.PENDING }),
    )
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ payment_url: null, status: ORDER_STATUS.PAYMENT_FAILED }),
      }),
    })

    const result = await service.getPaymentStatus('bbbbbbbbbbbbbbbbbbbbbbbb')

    expect(result.status).toBe(GATEWAY_PAYMENT_STATUS.PENDING)
    expect(result.canRetry).toBe(true)
  })

  // A.9 — status SUCCESS
  it('should return canRetry: false for SUCCESS payment', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.SUCCESS }),
    )
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ payment_url: null, status: ORDER_STATUS.CONFIRMED }),
      }),
    })

    const result = await service.getPaymentStatus('bbbbbbbbbbbbbbbbbbbbbbbb')

    expect(result.status).toBe(GATEWAY_PAYMENT_STATUS.SUCCESS)
    expect(result.canRetry).toBe(false)
  })

  // A.10 — status FAILED
  it('should return canRetry: true for FAILED payment', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.FAILED }),
    )
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ payment_url: null, status: ORDER_STATUS.PAYMENT_FAILED }),
      }),
    })

    const result = await service.getPaymentStatus('bbbbbbbbbbbbbbbbbbbbbbbb')

    expect(result.status).toBe(GATEWAY_PAYMENT_STATUS.FAILED)
    expect(result.canRetry).toBe(true)
  })

  // no payment record at all → returns NONE
  it('should return status NONE when no payment record exists for the order', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(null)
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    })

    const result = await service.getPaymentStatus('bbbbbbbbbbbbbbbbbbbbbbbb')

    expect(result.status).toBe('NONE')
    expect(result.canRetry).toBe(false)
    expect(result.paymentUrl).toBeNull()
    expect(result.provider).toBeNull()
  })
})

// ─── PaymentService — handleIpn idempotency ───────────────────────────────────

describe('PaymentService — handleIpn idempotency', () => {
  let service: PaymentService
  let repoInstance: jest.Mocked<PaymentRepository>
  let mockMomoProvider: jest.Mocked<IPaymentProvider>

  beforeEach(() => {
    jest.clearAllMocks()

    // Instantiate the mocked repository
    new MockPaymentRepository()
    repoInstance = MockPaymentRepository.mock.instances[0] as jest.Mocked<PaymentRepository>
    mockMomoProvider = makeMockProvider()
    service = new PaymentService(repoInstance, makeProviderMap(mockMomoProvider), makeMockOrderService)
  })

  it('skips processing and does NOT update order when payment is already SUCCESS (duplicate IPN)', async () => {
    // Payment already succeeded — simulates a duplicate IPN delivery
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.SUCCESS }),
    )

    // Provide a valid IPN payload for MoMo
    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      transactionId: 'txn_001',
      amount: 150000,
      success: true,
      resultCode: 0,
      message: 'Successful.',
      rawData: {},
    })

    await service.handleIpn(PaymentProvider.MOMO, { orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb' })

    // Order must NOT be updated again
    expect(mockOrderModel.findByIdAndUpdate).not.toHaveBeenCalled()
    // Socket must NOT be emitted again
    expect(mockEmitToUser).not.toHaveBeenCalled()
    // Repository update must NOT be called
    expect(repoInstance.updateById).not.toHaveBeenCalled()
  })

  it('processes IPN and calls transitionOrderPaymentStatus with PAYMENT_SUCCESS when payment succeeds', async () => {
    const mockTransition = transitionOrderPaymentStatus as jest.Mock
    mockTransition.mockResolvedValue({ success: true, newStatus: ORDER_STATUS.CONFIRMED })

    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.PENDING }),
    )
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    const mockLean = jest.fn().mockResolvedValue(makeOrder())
    const mockSession = jest.fn().mockReturnValue({ lean: mockLean })
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({ session: mockSession })

    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      transactionId: 'txn_002',
      amount: 150000,
      success: true,
      resultCode: 0,
      message: 'Successful.',
      rawData: {},
    })

    await service.handleIpn(PaymentProvider.MOMO, { orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb' })

    expect(repoInstance.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: GATEWAY_PAYMENT_STATUS.SUCCESS }),
    )
    expect(mockTransition).toHaveBeenCalledWith(
      'bbbbbbbbbbbbbbbbbbbbbbbb',
      'PAYMENT_SUCCESS',
      expect.objectContaining({
        extraUpdate: expect.objectContaining({ payment_status: PAYMENT_STATUS.PAID }),
      }),
    )
    expect(mockEmitToUser).toHaveBeenCalledWith(
      'user_001',
      expect.any(String),
      expect.objectContaining({ payment_status: PAYMENT_STATUS.PAID }),
    )
  })

  it('rejects IPN with invalid signature and throws', async () => {
    mockMomoProvider.verifyIpn = jest.fn().mockReturnValue(false)

    await expect(
      service.handleIpn(PaymentProvider.MOMO, { orderId: 'order_tampered' }),
    ).rejects.toThrow('IPN signature verification failed')

    expect(repoInstance.findLatestByOrderId).not.toHaveBeenCalled()
  })

  it('calls transitionOrderPaymentStatus with PAYMENT_FAIL when IPN reports failure', async () => {
    const mockTransition = transitionOrderPaymentStatus as jest.Mock
    mockTransition.mockResolvedValue({ success: true, newStatus: ORDER_STATUS.PAYMENT_FAILED })

    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.PENDING }),
    )
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    const mockLean = jest.fn().mockResolvedValue(makeOrder())
    const mockSession = jest.fn().mockReturnValue({ lean: mockLean })
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({ session: mockSession })

    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      transactionId: 'txn_003',
      amount: 150000,
      success: false,
      resultCode: 1006,
      message: 'Transaction declined.',
      rawData: {},
    })

    await service.handleIpn(PaymentProvider.MOMO, { orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb' })

    expect(repoInstance.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: GATEWAY_PAYMENT_STATUS.FAILED }),
    )
    expect(mockTransition).toHaveBeenCalledWith(
      'bbbbbbbbbbbbbbbbbbbbbbbb',
      'PAYMENT_FAIL',
      expect.objectContaining({
        extraUpdate: expect.objectContaining({ payment_status: PAYMENT_STATUS.FAILED }),
      }),
    )
  })

  // handleOrderIpn — payment not found for orderId
  it('handleOrderIpn: returns silently when no payment record exists for the orderId', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(null)

    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      transactionId: 'txn_004',
      amount: 150000,
      success: true,
      resultCode: 0,
      message: 'Successful.',
      rawData: {},
    })

    await service.handleIpn(PaymentProvider.MOMO, { orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb' })

    // Should not update anything, no transition, no emit
    expect(repoInstance.updateById).not.toHaveBeenCalled()
    expect(transitionOrderPaymentStatus).not.toHaveBeenCalled()
    expect(mockEmitToUser).not.toHaveBeenCalled()
  })

  // handleOrderIpn — order not found in DB after payment found
  it('handleOrderIpn: returns silently when order document is not found in DB', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.PENDING }),
    )
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    // Order not found in DB
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    })

    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      transactionId: 'txn_order_null',
      amount: 150000,
      success: true,
      resultCode: 0,
      message: 'Successful.',
      rawData: {},
    })

    await service.handleIpn(PaymentProvider.MOMO, { orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb' })

    // No transition or emit should occur
    expect(transitionOrderPaymentStatus).not.toHaveBeenCalled()
    expect(mockEmitToUser).not.toHaveBeenCalled()
  })

  // handleOrderIpn — amount mismatch marks payment FAILED
  it('handleOrderIpn: marks payment FAILED when IPN amount does not match order total', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.PENDING }),
    )
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    // Order total is 150000, but IPN reports 99999
    const orderWithDifferentTotal = makeOrder({ total: 150000 })
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(orderWithDifferentTotal),
      }),
    })

    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      transactionId: 'txn_005',
      amount: 99999, // intentionally mismatched
      success: true,
      resultCode: 0,
      message: 'Successful.',
      rawData: {},
    })

    await service.handleIpn(PaymentProvider.MOMO, { orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb' })

    expect(repoInstance.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: GATEWAY_PAYMENT_STATUS.FAILED }),
    )
    expect(transitionOrderPaymentStatus).not.toHaveBeenCalled()
    expect(mockIncrementFailed).toHaveBeenCalled()
    expect(mockEmitToUser).not.toHaveBeenCalled()
  })
})

// ─── PaymentService — createPaymentSession ────────────────────────────────────

describe('PaymentService — createPaymentSession', () => {
  let service: PaymentService
  let repoInstance: jest.Mocked<PaymentRepository>
  let mockMomoProvider: jest.Mocked<IPaymentProvider>

  const defaultInput = {
    cartItems: [{ productId: 'aabbccddeeff001122334455', skuId: 'aabbccddeeff001122334466', buyCount: 2, price: 75000 }],
    shippingAddressId: 'aabbccddeeff001122334477',
    shippingMethodId: 'standard',
    paymentMethod: 'e_wallet',
    eWalletProvider: 'MOMO',
    amount: 150000,
    clientIp: '127.0.0.1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    new MockPaymentRepository()
    repoInstance = MockPaymentRepository.mock.instances[0] as jest.Mocked<PaymentRepository>
    mockMomoProvider = makeMockProvider()
    service = new PaymentService(repoInstance, makeProviderMap(mockMomoProvider), makeMockOrderService)
  })

  it('happy path: creates session, calls provider.createPayment, returns sessionId and payment_url', async () => {
    const sessionId = new mongoose.Types.ObjectId()
    const paymentId = new mongoose.Types.ObjectId()

    ;(mockPaymentSessionModel.create as jest.Mock).mockResolvedValue({
      _id: sessionId,
      ...defaultInput,
    })

    const paymentRecord = makePaymentRecord({ _id: paymentId, sessionId })
    repoInstance.create = jest.fn().mockResolvedValue(paymentRecord)
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    ;(mockPaymentSessionModel.findByIdAndUpdate as jest.Mock).mockReturnValue(undefined)

    mockMomoProvider.createPayment = jest.fn().mockResolvedValue({
      paymentUrl: 'https://momo.vn/pay/session-123',
      requestId: 'req-001',
      transactionId: 'txn-session-001',
    })

    const result = await service.createPaymentSession('aaaaaaaaaaaaaaaaaaaaaaaa', defaultInput)

    expect(result.sessionId).toBe(sessionId.toString())
    expect(result.payment_url).toBe('https://momo.vn/pay/session-123')

    // Session should be created
    expect(mockPaymentSessionModel.create).toHaveBeenCalled()

    // Payment should be created via repo
    expect(repoInstance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: expect.any(mongoose.Types.ObjectId),
        provider: 'MOMO',
        amount: 150000,
        status: GATEWAY_PAYMENT_STATUS.PENDING,
      }),
    )

    // Provider should be called
    expect(mockMomoProvider.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 150000,
        clientIp: '127.0.0.1',
      }),
    )

    // metrics should be incremented
    expect(mockIncrementInitiated).toHaveBeenCalled()
  })

  it('error path: provider.createPayment throws → marks payment FAILED, marks session FAILED, re-throws', async () => {
    const sessionId = new mongoose.Types.ObjectId()
    const paymentId = new mongoose.Types.ObjectId()

    ;(mockPaymentSessionModel.create as jest.Mock).mockResolvedValue({
      _id: sessionId,
      ...defaultInput,
    })

    const paymentRecord = makePaymentRecord({ _id: paymentId, sessionId })
    repoInstance.create = jest.fn().mockResolvedValue(paymentRecord)
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    const providerError = new Error('Provider network failure')
    mockMomoProvider.createPayment = jest.fn().mockRejectedValue(providerError)

    await expect(
      service.createPaymentSession('aaaaaaaaaaaaaaaaaaaaaaaa', defaultInput),
    ).rejects.toThrow('Provider network failure')

    // Payment record should be marked FAILED
    expect(repoInstance.updateById).toHaveBeenCalledWith(
      paymentId,
      expect.objectContaining({ status: GATEWAY_PAYMENT_STATUS.FAILED }),
    )

    // Session should be marked FAILED
    expect(mockPaymentSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      sessionId.toString(),
      expect.objectContaining({ status: PAYMENT_SESSION_STATUS.FAILED }),
    )
  })
})

// ─── PaymentService — getSessionStatus ────────────────────────────────────────

describe('PaymentService — getSessionStatus', () => {
  let service: PaymentService
  let repoInstance: jest.Mocked<PaymentRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    new MockPaymentRepository()
    repoInstance = MockPaymentRepository.mock.instances[0] as jest.Mocked<PaymentRepository>
    service = new PaymentService(repoInstance, makeProviderMap(), makeMockOrderService)
  })

  it('session not found → throws with statusCode 404', async () => {
    ;(mockPaymentSessionModel.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })

    await expect(
      service.getSessionStatus('eeeeeeeeeeeeeeeeeeeeeeee', 'user_001'),
    ).rejects.toThrow('Payment session not found')

    try {
      await service.getSessionStatus('eeeeeeeeeeeeeeeeeeeeeeee', 'user_001')
    } catch (err: any) {
      expect(err.statusCode).toBe(404)
    }
  })

  it('session belongs to different user → throws with statusCode 404', async () => {
    const session = makePaymentSession({
      userId: new mongoose.Types.ObjectId('ffffffffffffffffffffffff'),
    })

    ;(mockPaymentSessionModel.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(session),
    })

    await expect(
      service.getSessionStatus('eeeeeeeeeeeeeeeeeeeeeeee', 'user_001'),
    ).rejects.toThrow('Payment session not found')

    try {
      await service.getSessionStatus('eeeeeeeeeeeeeeeeeeeeeeee', 'user_001')
    } catch (err: any) {
      expect(err.statusCode).toBe(404)
    }
  })

  it('session found, no order yet → returns status with orderId undefined', async () => {
    const sessionId = 'eeeeeeeeeeeeeeeeeeeeeeee'
    const session = makePaymentSession({
      _id: new mongoose.Types.ObjectId(sessionId),
      status: PAYMENT_SESSION_STATUS.PENDING,
    })

    ;(mockPaymentSessionModel.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(session),
    })

    ;(mockOrderModel.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    })

    const result = await service.getSessionStatus(sessionId, 'aaaaaaaaaaaaaaaaaaaaaaaa')

    expect(result.status).toBe(PAYMENT_SESSION_STATUS.PENDING)
    expect(result.orderId).toBeUndefined()
  })

  it('session found, order exists → returns status with orderId', async () => {
    const sessionId = 'eeeeeeeeeeeeeeeeeeeeeeee'
    const orderId = 'cccccccccccccccccccccccc'
    const session = makePaymentSession({
      _id: new mongoose.Types.ObjectId(sessionId),
      status: PAYMENT_SESSION_STATUS.PAID,
    })

    ;(mockPaymentSessionModel.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(session),
    })

    ;(mockOrderModel.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(orderId) }),
      }),
    })

    const result = await service.getSessionStatus(sessionId, 'aaaaaaaaaaaaaaaaaaaaaaaa')

    expect(result.status).toBe(PAYMENT_SESSION_STATUS.PAID)
    expect(result.orderId).toBe(orderId)
  })
})

// ─── PaymentService — handleSessionIpn (via handleIpn with session-prefixed orderId) ──

describe('PaymentService — handleSessionIpn', () => {
  let service: PaymentService
  let repoInstance: jest.Mocked<PaymentRepository>
  let mockMomoProvider: jest.Mocked<IPaymentProvider>
  let mockOrderService: ReturnType<typeof makeMockOrderService>

  const sessionId = 'eeeeeeeeeeeeeeeeeeeeeeee'
  // SESSION_ID_PREFIX = 'session_'
  const sessionOrderId = `session_${sessionId}`

  function setupHappyPathSession() {
    const session = makePaymentSession({
      _id: new mongoose.Types.ObjectId(sessionId),
      status: PAYMENT_SESSION_STATUS.PENDING,
      amount: 150000,
    })

    const mongoSession = {
      withTransaction: jest.fn().mockImplementation(async (fn) => { await fn() }),
      endSession: jest.fn().mockResolvedValue(undefined),
    }
    ;(mongoose.startSession as jest.Mock).mockResolvedValue(mongoSession)

    const paymentRecord = makePaymentRecord({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      status: GATEWAY_PAYMENT_STATUS.PENDING,
    })
    repoInstance.findBySessionId = jest.fn().mockResolvedValue(paymentRecord)
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    return { session, mongoSession, paymentRecord }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    new MockPaymentRepository()
    repoInstance = MockPaymentRepository.mock.instances[0] as jest.Mocked<PaymentRepository>
    mockMomoProvider = makeMockProvider()
    mockOrderService = makeMockOrderService()
    service = new PaymentService(repoInstance, makeProviderMap(mockMomoProvider), () => mockOrderService)
  })

  it('session not found → returns silently (no action taken)', async () => {
    const mongoSession = {
      withTransaction: jest.fn().mockImplementation(async (fn) => { await fn() }),
      endSession: jest.fn().mockResolvedValue(undefined),
    }
    ;(mongoose.startSession as jest.Mock).mockResolvedValue(mongoSession)

    // findById returns null inside the transaction
    ;(mockPaymentSessionModel.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    })

    mockMomoProvider.verifyIpn = jest.fn().mockReturnValue(true)
    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: sessionOrderId,
      transactionId: 'txn_session_001',
      amount: 150000,
      success: true,
      resultCode: 0,
      message: 'Successful.',
      rawData: {},
    })

    await service.handleIpn(PaymentProvider.MOMO, { orderId: sessionOrderId })

    // No updates should occur
    expect(repoInstance.updateById).not.toHaveBeenCalled()
    expect(mockIncrementSuccess).not.toHaveBeenCalled()
  })

  it('session already PAID → idempotency: returns silently, no updates', async () => {
    const session = makePaymentSession({
      _id: new mongoose.Types.ObjectId(sessionId),
      status: PAYMENT_SESSION_STATUS.PAID,
      amount: 150000,
    })

    const mongoSession = {
      withTransaction: jest.fn().mockImplementation(async (fn) => { await fn() }),
      endSession: jest.fn().mockResolvedValue(undefined),
    }
    ;(mongoose.startSession as jest.Mock).mockResolvedValue(mongoSession)

    ;(mockPaymentSessionModel.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(session),
      }),
    })

    repoInstance.findBySessionId = jest.fn().mockResolvedValue(null)

    mockMomoProvider.verifyIpn = jest.fn().mockReturnValue(true)
    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: sessionOrderId,
      transactionId: 'txn_session_002',
      amount: 150000,
      success: true,
      resultCode: 0,
      message: 'Successful.',
      rawData: {},
    })

    await service.handleIpn(PaymentProvider.MOMO, { orderId: sessionOrderId })

    // Should return early, no update to session status
    expect(repoInstance.updateById).not.toHaveBeenCalled()
  })

  it('amount mismatch → marks payment FAILED, marks session FAILED, increments failed metric', async () => {
    const session = makePaymentSession({
      _id: new mongoose.Types.ObjectId(sessionId),
      status: PAYMENT_SESSION_STATUS.PENDING,
      amount: 150000,
    })

    const mongoSession = {
      withTransaction: jest.fn().mockImplementation(async (fn) => { await fn() }),
      endSession: jest.fn().mockResolvedValue(undefined),
    }
    ;(mongoose.startSession as jest.Mock).mockResolvedValue(mongoSession)

    const paymentRecord = makePaymentRecord({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      status: GATEWAY_PAYMENT_STATUS.PENDING,
    })
    repoInstance.findBySessionId = jest.fn().mockResolvedValue(paymentRecord)
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    ;(mockPaymentSessionModel.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(session),
      }),
    })

    ;(mockPaymentSessionModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue(undefined),
    })

    mockMomoProvider.verifyIpn = jest.fn().mockReturnValue(true)
    // IPN amount 99999 does NOT match session amount 150000
    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: sessionOrderId,
      transactionId: 'txn_session_003',
      amount: 99999,
      success: true,
      resultCode: 0,
      message: 'Successful.',
      rawData: {},
    })

    await service.handleIpn(PaymentProvider.MOMO, { orderId: sessionOrderId })

    // Payment should be marked FAILED
    expect(repoInstance.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: GATEWAY_PAYMENT_STATUS.FAILED }),
    )

    // Session should be marked FAILED
    expect(mockPaymentSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ status: PAYMENT_SESSION_STATUS.FAILED }),
    )

    expect(mockIncrementFailed).toHaveBeenCalled()
  })

  it('success IPN → marks payment SUCCESS, marks session PAID, calls createOrderFromSession via setImmediate', async () => {
    const { session } = setupHappyPathSession()

    ;(mockPaymentSessionModel.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(session),
      }),
    })

    ;(mockPaymentSessionModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue(undefined),
    })

    mockMomoProvider.verifyIpn = jest.fn().mockReturnValue(true)
    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: sessionOrderId,
      transactionId: 'txn_session_004',
      amount: 150000,
      success: true,
      resultCode: 0,
      message: 'Successful.',
      rawData: {},
    })

    // Use a promise to capture the setImmediate callback
    let createOrderCall: Promise<unknown> = Promise.resolve()
    jest.spyOn(global, 'setImmediate').mockImplementation(((fn: () => void) => {
      createOrderCall = Promise.resolve().then(() => fn())
      return { _onImmediate: fn } as unknown as NodeJS.Immediate
    }) as typeof setImmediate)

    await service.handleIpn(PaymentProvider.MOMO, { orderId: sessionOrderId })

    // Payment should be marked SUCCESS
    expect(repoInstance.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: GATEWAY_PAYMENT_STATUS.SUCCESS }),
    )

    // Session should be marked PAID
    expect(mockPaymentSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ status: PAYMENT_SESSION_STATUS.PAID }),
    )

    expect(mockIncrementSuccess).toHaveBeenCalled()

    // Wait for setImmediate to fire
    await createOrderCall

    // createOrderFromSession should have been called
    expect(mockOrderService.createOrderFromSession).toHaveBeenCalledWith(sessionId)

    jest.spyOn(global, 'setImmediate').mockRestore()
  })

  it('failure IPN → marks payment FAILED, marks session FAILED', async () => {
    const { session } = setupHappyPathSession()

    ;(mockPaymentSessionModel.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(session),
      }),
    })

    ;(mockPaymentSessionModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue(undefined),
    })

    mockMomoProvider.verifyIpn = jest.fn().mockReturnValue(true)
    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: sessionOrderId,
      transactionId: 'txn_session_005',
      amount: 150000,
      success: false,
      resultCode: 1006,
      message: 'Transaction declined.',
      rawData: {},
    })

    await service.handleIpn(PaymentProvider.MOMO, { orderId: sessionOrderId })

    // Payment should be marked FAILED
    expect(repoInstance.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: GATEWAY_PAYMENT_STATUS.FAILED }),
    )

    // Session should be marked FAILED
    expect(mockPaymentSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ status: PAYMENT_SESSION_STATUS.FAILED }),
    )

    expect(mockIncrementFailed).toHaveBeenCalled()
  })

  it('success IPN: createOrderFromSession throws → error is swallowed, does not propagate', async () => {
    const { session } = setupHappyPathSession()

    ;(mockPaymentSessionModel.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(session),
      }),
    })

    ;(mockPaymentSessionModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue(undefined),
    })

    // createOrderFromSession will throw
    mockOrderService.createOrderFromSession = jest.fn().mockRejectedValue(new Error('DB connection lost'))

    mockMomoProvider.verifyIpn = jest.fn().mockReturnValue(true)
    mockMomoProvider.parseIpnResult = jest.fn().mockReturnValue({
      orderId: sessionOrderId,
      transactionId: 'txn_session_006',
      amount: 150000,
      success: true,
      resultCode: 0,
      message: 'Successful.',
      rawData: {},
    })

    let createOrderCall: Promise<unknown> = Promise.resolve()
    jest.spyOn(global, 'setImmediate').mockImplementation(((fn: () => void) => {
      createOrderCall = Promise.resolve().then(() => fn())
      return { _onImmediate: fn } as unknown as NodeJS.Immediate
    }) as typeof setImmediate)

    // handleIpn itself should NOT throw even though createOrderFromSession throws
    await expect(
      service.handleIpn(PaymentProvider.MOMO, { orderId: sessionOrderId }),
    ).resolves.toBeUndefined()

    // Wait for setImmediate to fire and swallow the error
    await createOrderCall

    // The session and payment should still be marked as success
    expect(repoInstance.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: GATEWAY_PAYMENT_STATUS.SUCCESS }),
    )

    jest.spyOn(global, 'setImmediate').mockRestore()
  })
})
