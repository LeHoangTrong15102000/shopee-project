/// <reference types="jest" />
import crypto from 'crypto'

// ─── Mock the vnpay package ───────────────────────────────────────────────────
// VnpayProvider wraps the `vnpay` npm package. We mock it so tests run without
// real network calls or valid credentials.
jest.mock('vnpay', () => {
  const mockVerifyIpnCall = jest.fn()
  const mockBuildPaymentUrl = jest.fn()
  const mockQueryDr = jest.fn()

  const MockVNPay = jest.fn().mockImplementation(() => ({
    verifyIpnCall: mockVerifyIpnCall,
    buildPaymentUrl: mockBuildPaymentUrl,
    queryDr: mockQueryDr,
  }))

  ;(MockVNPay as any).__mockVerifyIpnCall = mockVerifyIpnCall
  ;(MockVNPay as any).__mockBuildPaymentUrl = mockBuildPaymentUrl
  ;(MockVNPay as any).__mockQueryDr = mockQueryDr

  return { VNPay: MockVNPay, HashAlgorithm: { SHA512: 'SHA512' } }
})

// ─── Mock axios for MoMo HTTP calls ──────────────────────────────────────────
jest.mock('axios')
import axios from 'axios'
const mockAxios = axios as jest.Mocked<typeof axios>

import { VNPay } from 'vnpay'
import { MomoProvider } from '@services/payment/momo.provider'
import { VnpayProvider } from '@services/payment/vnpay.provider'

// Helper to access inner mocks on the VNPay constructor
const getVnpayMocks = () => {
  const MockVNPay = VNPay as any
  return {
    verifyIpnCall: MockVNPay.__mockVerifyIpnCall as jest.Mock,
    buildPaymentUrl: MockVNPay.__mockBuildPaymentUrl as jest.Mock,
    queryDr: MockVNPay.__mockQueryDr as jest.Mock,
  }
}

// ─── Shared HMAC helper (mirrors momo.provider.ts implementation) ─────────────
function hmacSha256(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}

// ─── MoMo Provider Tests ──────────────────────────────────────────────────────

describe('MomoProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── Signature generation ─────────────────────────────────────────────────

  describe('createPayment — signature generation', () => {
    it('generates a 64-char lowercase hex HMAC-SHA256 signature', async () => {
      const params = {
        orderId: 'order_001',
        amount: 150000,
        orderInfo: 'Test order',
        returnUrl: 'https://example.com/return',
        ipnUrl: 'https://example.com/ipn',
        clientIp: '127.0.0.1',
        requestId: 'req_001',
      }

      let capturedBody: any = null
      mockAxios.post = jest.fn().mockImplementation((_url, body) => {
        capturedBody = body
        return Promise.resolve({
          data: { resultCode: 0, payUrl: 'https://momo.vn/pay/xxx', orderId: params.orderId },
        })
      })

      const provider = new MomoProvider()
      await provider.createPayment(params)

      expect(capturedBody).not.toBeNull()
      // Signature must be a 64-char lowercase hex string (SHA-256 output)
      expect(capturedBody.signature).toMatch(/^[0-9a-f]{64}$/)
    })

    it('includes all required fields in the request body', async () => {
      const params = {
        orderId: 'order_002',
        amount: 200000,
        orderInfo: 'Another order',
        returnUrl: 'https://example.com/return',
        ipnUrl: 'https://example.com/ipn',
        clientIp: '127.0.0.1',
        requestId: 'req_002',
      }

      let capturedBody: any = null
      mockAxios.post = jest.fn().mockImplementation((_url, body) => {
        capturedBody = body
        return Promise.resolve({
          data: { resultCode: 0, payUrl: 'https://momo.vn/pay/yyy', orderId: params.orderId },
        })
      })

      const provider = new MomoProvider()
      await provider.createPayment(params)

      expect(capturedBody).toMatchObject({
        orderId: params.orderId,
        amount: params.amount,
        orderInfo: params.orderInfo,
        redirectUrl: params.returnUrl,
        ipnUrl: params.ipnUrl,
        requestId: params.requestId,
        requestType: 'captureWallet',
        lang: 'vi',
      })
    })

    it('throws when MoMo returns a non-zero resultCode', async () => {
      mockAxios.post = jest.fn().mockResolvedValue({
        data: { resultCode: 1001, message: 'Invalid partner' },
      })

      const provider = new MomoProvider()
      await expect(
        provider.createPayment({
          orderId: 'order_003',
          amount: 50000,
          orderInfo: 'Test',
          returnUrl: 'https://example.com/return',
          ipnUrl: 'https://example.com/ipn',
          clientIp: '127.0.0.1',
          requestId: 'req_003',
        }),
      ).rejects.toThrow('MoMo payment creation failed')
    })
  })

  // ─── IPN verification — round-trip ───────────────────────────────────────
  // We test the round-trip: build a payload whose signature was computed with
  // the same SECRET_KEY the module uses (whatever it loaded at import time).
  // This avoids the module-level constant capture problem.

  describe('verifyIpn', () => {
    // Build a payload and sign it using the same key the module will use.
    // The module reads SECRET_KEY from process.env at import time; in tests
    // that value is '' (empty string) unless overridden before import.
    // We derive the expected signature at runtime so the test is always consistent.
    function buildSignedPayload(secretKey: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
      const base: Record<string, unknown> = {
        accessKey: process.env.MOMO_ACCESS_KEY || '',
        amount: 150000,
        extraData: '',
        message: 'Successful.',
        orderId: 'order_001',
        orderInfo: 'Test order',
        orderType: 'momo_wallet',
        partnerCode: process.env.MOMO_PARTNER_CODE || '',
        payType: 'qr',
        requestId: 'req_001',
        responseTime: 1700000000000,
        resultCode: 0,
        transId: 9876543210,
        ...overrides,
      }

      const rawSignature = [
        `accessKey=${base.accessKey}`,
        `amount=${base.amount}`,
        `extraData=${base.extraData}`,
        `message=${base.message}`,
        `orderId=${base.orderId}`,
        `orderInfo=${base.orderInfo}`,
        `orderType=${base.orderType}`,
        `partnerCode=${base.partnerCode}`,
        `payType=${base.payType}`,
        `requestId=${base.requestId}`,
        `responseTime=${base.responseTime}`,
        `resultCode=${base.resultCode}`,
        `transId=${base.transId}`,
      ].join('&')

      base.signature = hmacSha256(rawSignature, secretKey)
      return base
    }

    it('returns true for a payload whose signature matches the module secret key', () => {
      const provider = new MomoProvider()
      // Use the same key the module loaded (empty string in test env)
      const moduleSecretKey = process.env.MOMO_SECRET_KEY || ''
      const payload = buildSignedPayload(moduleSecretKey)
      expect(provider.verifyIpn(payload)).toBe(true)
    })

    it('returns false when the signature is tampered', () => {
      const provider = new MomoProvider()
      const moduleSecretKey = process.env.MOMO_SECRET_KEY || ''
      const payload = buildSignedPayload(moduleSecretKey)
      payload.signature = 'deadbeef'.repeat(8) // wrong 64-char hex
      expect(provider.verifyIpn(payload)).toBe(false)
    })

    it('returns false when a payload field is modified after signing', () => {
      const provider = new MomoProvider()
      const moduleSecretKey = process.env.MOMO_SECRET_KEY || ''
      const payload = buildSignedPayload(moduleSecretKey)
      // Tamper with amount after signature was computed
      payload.amount = 1
      expect(provider.verifyIpn(payload)).toBe(false)
    })
  })
})

// ─── VNPay Provider Tests ─────────────────────────────────────────────────────

describe('VnpayProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── IPN verification ─────────────────────────────────────────────────────

  describe('verifyIpn', () => {
    it('returns true when vnpay.verifyIpnCall returns { isVerified: true }', () => {
      const { verifyIpnCall } = getVnpayMocks()
      verifyIpnCall.mockReturnValue({ isVerified: true })

      const provider = new VnpayProvider()
      const result = provider.verifyIpn({
        vnp_TxnRef: 'txn_001',
        vnp_SecureHash: 'valid_hash',
      })

      expect(result).toBe(true)
      expect(verifyIpnCall).toHaveBeenCalledTimes(1)
    })

    it('returns false when vnpay.verifyIpnCall returns { isVerified: false }', () => {
      const { verifyIpnCall } = getVnpayMocks()
      verifyIpnCall.mockReturnValue({ isVerified: false })

      const provider = new VnpayProvider()
      const result = provider.verifyIpn({
        vnp_TxnRef: 'txn_002',
        vnp_SecureHash: 'bad_hash',
      })

      expect(result).toBe(false)
    })

    it('returns false (does not throw) when vnpay.verifyIpnCall throws', () => {
      const { verifyIpnCall } = getVnpayMocks()
      verifyIpnCall.mockImplementation(() => {
        throw new Error('Unexpected vnpay library error')
      })

      const provider = new VnpayProvider()
      expect(() => provider.verifyIpn({ vnp_TxnRef: 'txn_003' })).not.toThrow()
      expect(provider.verifyIpn({ vnp_TxnRef: 'txn_003' })).toBe(false)
    })
  })

  // ─── parseIpnResult ───────────────────────────────────────────────────────

  describe('parseIpnResult', () => {
    it('marks success=true and divides amount by 100 when vnp_ResponseCode is "00"', () => {
      const provider = new VnpayProvider()
      const result = provider.parseIpnResult({
        vnp_TxnRef: 'order_001',
        vnp_TransactionNo: '12345678',
        vnp_Amount: '15000000', // 150,000 VND × 100
        vnp_ResponseCode: '00',
      })

      expect(result.success).toBe(true)
      expect(result.amount).toBe(150000)
      expect(result.orderId).toBe('order_001')
      expect(result.transactionId).toBe('12345678')
    })

    it('marks success=false for non-"00" response codes', () => {
      const provider = new VnpayProvider()
      const result = provider.parseIpnResult({
        vnp_TxnRef: 'order_002',
        vnp_Amount: '5000000',
        vnp_ResponseCode: '24', // cancelled by user
      })

      expect(result.success).toBe(false)
      expect(result.resultCode).toBe('24')
    })
  })
})
