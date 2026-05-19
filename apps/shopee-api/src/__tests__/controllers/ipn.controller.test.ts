/// <reference types="jest" />

import { Request, Response } from 'express'
import { momoIpn, vnpayIpn } from '../../controllers/ipn.controller'
import { PaymentProvider } from '@services/payment/payment.interface'
import { Logger } from '@utils/logger'
import { emitToUser } from '../../socket/utils/emit'

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../container', () => ({
  paymentService: {
    handleIpn: jest.fn(),
    getProvider: jest.fn(),
  },
}))

jest.mock('../../socket/utils/emit', () => ({
  emitToUser: jest.fn(),
}))

import { paymentService } from '../../container'
const mockHandleIpn = paymentService.handleIpn as jest.Mock
const mockGetProvider = paymentService.getProvider as jest.Mock

// ─── Mock Logger ─────────────────────────────────────────────────────────────

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiWarn: jest.fn(),
    apiError: jest.fn(),
  },
}))

// ─── Request / Response helpers ───────────────────────────────────────────────

const createMockRequest = (
  options: { body?: any; query?: any; headers?: Record<string, string> } = {},
): Partial<Request> => ({
  body: options.body || {},
  query: options.query || {},
  headers: options.headers || {},
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.end = jest.fn().mockReturnValue(res)
  return res
}

// ─── MoMo IPN Tests ───────────────────────────────────────────────────────────

describe('momoIpn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 204 on successful IPN handling', async () => {
    mockHandleIpn.mockResolvedValue(undefined)

    const req = createMockRequest({
      body: { orderId: 'order_momo_001', resultCode: 0, transId: 12345 },
    })
    const res = createMockResponse()

    await momoIpn(req as Request, res as Response)

    expect(mockHandleIpn).toHaveBeenCalledWith(PaymentProvider.MOMO, req.body)
    expect(res.status).toHaveBeenCalledWith(204)
    expect(res.end).toHaveBeenCalled()
  })

  it('still returns 204 even when handleIpn throws', async () => {
    mockHandleIpn.mockRejectedValue(new Error('Database error'))

    const req = createMockRequest({
      body: { orderId: 'order_momo_002', resultCode: 0, transId: 12346 },
    })
    const res = createMockResponse()

    await momoIpn(req as Request, res as Response)

    expect(mockHandleIpn).toHaveBeenCalledWith(PaymentProvider.MOMO, req.body)
    expect(res.status).toHaveBeenCalledWith(204)
    expect(res.end).toHaveBeenCalled()
  })
})

// ─── VNPay IPN Tests ──────────────────────────────────────────────────────────

describe('vnpayIpn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns { RspCode: "00", Message: "Confirm Success" } on valid signature and success', async () => {
    const mockProvider = { verifyIpn: jest.fn().mockReturnValue(true) }
    mockGetProvider.mockReturnValue(mockProvider)
    mockHandleIpn.mockResolvedValue(undefined)

    const req = createMockRequest({
      query: {
        vnp_TxnRef: 'txn_vnpay_001',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: '9876543',
      },
    })
    const res = createMockResponse()

    await vnpayIpn(req as Request, res as Response)

    expect(mockProvider.verifyIpn).toHaveBeenCalledWith(req.query)
    expect(mockHandleIpn).toHaveBeenCalledWith(PaymentProvider.VNPAY, req.query)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ RspCode: '00', Message: 'Confirm Success' })
  })

  it('returns { RspCode: "97", Message: "Invalid Checksum" } when signature is invalid', async () => {
    const mockProvider = { verifyIpn: jest.fn().mockReturnValue(false) }
    mockGetProvider.mockReturnValue(mockProvider)

    const req = createMockRequest({
      query: {
        vnp_TxnRef: 'txn_vnpay_002',
        vnp_SecureHash: 'bad_hash',
      },
    })
    const res = createMockResponse()

    await vnpayIpn(req as Request, res as Response)

    expect(mockProvider.verifyIpn).toHaveBeenCalledWith(req.query)
    expect(mockHandleIpn).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ RspCode: '97', Message: 'Invalid Checksum' })
  })

  it('returns { RspCode: "99", Message: "Unknown error" } when handleIpn throws', async () => {
    const mockProvider = { verifyIpn: jest.fn().mockReturnValue(true) }
    mockGetProvider.mockReturnValue(mockProvider)
    mockHandleIpn.mockRejectedValue(new Error('Unexpected error'))

    const req = createMockRequest({
      query: {
        vnp_TxnRef: 'txn_vnpay_003',
        vnp_ResponseCode: '00',
      },
    })
    const res = createMockResponse()

    await vnpayIpn(req as Request, res as Response)

    expect(mockProvider.verifyIpn).toHaveBeenCalledWith(req.query)
    expect(mockHandleIpn).toHaveBeenCalledWith(PaymentProvider.VNPAY, req.query)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ RspCode: '99', Message: 'Unknown error' })
  })
})
