/// <reference types="jest" />

// ─── Mock dependencies ────────────────────────────────────────────────────────

jest.mock('@repositories/payment.repository')
jest.mock('@database/models/order.model', () => ({
  OrderModel: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
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

// Mock MoMo and VNPay providers so no real HTTP calls are made
jest.mock('@services/payment/momo.provider', () => ({
  MomoProvider: jest.fn().mockImplementation(() => ({
    verifyIpn: jest.fn().mockReturnValue(true),
    parseIpnResult: jest.fn(),
    createPayment: jest.fn(),
    queryStatus: jest.fn(),
  })),
}))

jest.mock('@services/payment/vnpay.provider', () => ({
  VnpayProvider: jest.fn().mockImplementation(() => ({
    verifyIpn: jest.fn().mockReturnValue(true),
    parseIpnResult: jest.fn(),
    createPayment: jest.fn(),
    queryStatus: jest.fn(),
  })),
}))

import { PaymentService } from '@services/payment.service'
import { PaymentRepository } from '@repositories/payment.repository'
import { OrderModel, ORDER_STATUS, PAYMENT_STATUS } from '@database/models/order.model'
import { GATEWAY_PAYMENT_STATUS } from '@database/models/payment.model'
import { PaymentProvider } from '@services/payment/payment.interface'
import { emitToUser } from '../../socket/utils/emit'
import mongoose from 'mongoose'

const MockPaymentRepository = PaymentRepository as jest.MockedClass<typeof PaymentRepository>
const mockOrderModel = OrderModel as jest.Mocked<typeof OrderModel>
const mockEmitToUser = emitToUser as jest.Mock

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePaymentRecord(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    orderId: new mongoose.Types.ObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
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

// ─── PaymentService — handleIpn idempotency ───────────────────────────────────

describe('PaymentService — handleIpn idempotency', () => {
  let service: PaymentService
  let repoInstance: jest.Mocked<PaymentRepository>

  beforeEach(() => {
    jest.clearAllMocks()

    // Instantiate the mocked repository
    new MockPaymentRepository()
    repoInstance = MockPaymentRepository.mock.instances[0] as jest.Mocked<PaymentRepository>

    service = new PaymentService(repoInstance)
  })

  it('skips processing and does NOT update order when payment is already SUCCESS (duplicate IPN)', async () => {
    // Payment already succeeded — simulates a duplicate IPN delivery
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.SUCCESS }),
    )

    // Provide a valid IPN payload for MoMo
    const momoProvider = service.getProvider(PaymentProvider.MOMO) as any
    momoProvider.parseIpnResult = jest.fn().mockReturnValue({
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

  it('processes IPN and updates order to CONFIRMED when payment succeeds', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.PENDING }),
    )
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    const mockLean = jest.fn().mockResolvedValue(makeOrder())
    const mockSession = jest.fn().mockReturnValue({ lean: mockLean })
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({ session: mockSession })
    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ session: jest.fn() })

    const momoProvider = service.getProvider(PaymentProvider.MOMO) as any
    momoProvider.parseIpnResult = jest.fn().mockReturnValue({
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
    expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'bbbbbbbbbbbbbbbbbbbbbbbb',
      expect.objectContaining({ status: ORDER_STATUS.CONFIRMED }),
    )
    expect(mockEmitToUser).toHaveBeenCalledWith(
      'user_001',
      expect.any(String),
      expect.objectContaining({ payment_status: PAYMENT_STATUS.PAID }),
    )
  })

  it('rejects IPN with invalid signature and throws', async () => {
    const momoProvider = service.getProvider(PaymentProvider.MOMO) as any
    momoProvider.verifyIpn = jest.fn().mockReturnValue(false)

    await expect(
      service.handleIpn(PaymentProvider.MOMO, { orderId: 'order_tampered' }),
    ).rejects.toThrow('IPN signature verification failed')

    expect(repoInstance.findLatestByOrderId).not.toHaveBeenCalled()
  })

  it('marks payment FAILED and does NOT update order to CONFIRMED when IPN reports failure', async () => {
    repoInstance.findLatestByOrderId = jest.fn().mockResolvedValue(
      makePaymentRecord({ status: GATEWAY_PAYMENT_STATUS.PENDING }),
    )
    repoInstance.updateById = jest.fn().mockResolvedValue(undefined)

    const mockLean = jest.fn().mockResolvedValue(makeOrder())
    const mockSession = jest.fn().mockReturnValue({ lean: mockLean })
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({ session: mockSession })
    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ session: jest.fn() })

    const momoProvider = service.getProvider(PaymentProvider.MOMO) as any
    momoProvider.parseIpnResult = jest.fn().mockReturnValue({
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
    expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'bbbbbbbbbbbbbbbbbbbbbbbb',
      expect.objectContaining({ status: ORDER_STATUS.PAYMENT_FAILED }),
    )
  })
})
