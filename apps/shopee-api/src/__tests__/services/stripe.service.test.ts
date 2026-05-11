/// <reference types="jest" />

// Stripe SDK v22 uses `export = StripeConstructor` (CJS default).
// We mock the entire module so the constructor returns a controlled object.
// The mock shape mirrors the actual Stripe SDK structure used by StripeService.
jest.mock('stripe', () => {
  const mockPaymentIntentsCreate = jest.fn()
  const mockPaymentIntentsRetrieve = jest.fn()
  const mockPaymentIntentsCancel = jest.fn()
  const mockWebhooksConstructEvent = jest.fn()

  const MockStripe = jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
      retrieve: mockPaymentIntentsRetrieve,
      cancel: mockPaymentIntentsCancel,
    },
    webhooks: {
      constructEvent: mockWebhooksConstructEvent,
    },
  }))

  // Expose the inner mocks on the constructor so tests can access them
  ;(MockStripe as any).__mockPaymentIntentsCreate = mockPaymentIntentsCreate
  ;(MockStripe as any).__mockPaymentIntentsRetrieve = mockPaymentIntentsRetrieve
  ;(MockStripe as any).__mockPaymentIntentsCancel = mockPaymentIntentsCancel
  ;(MockStripe as any).__mockWebhooksConstructEvent = mockWebhooksConstructEvent

  return MockStripe
})

import Stripe from 'stripe'
import { StripeService } from '@services/stripe.service'

// Helper to access the inner mocks attached to the constructor
const getMocks = () => {
  const MockStripe = Stripe as any
  return {
    paymentIntentsCreate: MockStripe.__mockPaymentIntentsCreate as jest.Mock,
    paymentIntentsRetrieve: MockStripe.__mockPaymentIntentsRetrieve as jest.Mock,
    paymentIntentsCancel: MockStripe.__mockPaymentIntentsCancel as jest.Mock,
    webhooksConstructEvent: MockStripe.__mockWebhooksConstructEvent as jest.Mock,
  }
}

describe('StripeService', () => {
  let service: StripeService

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock'
    service = new StripeService()
  })

  // ─── 1.2 createPaymentIntent — correct args ───────────────────────────────

  describe('createPaymentIntent', () => {
    it('calls stripe.paymentIntents.create with amount as-is, currency, metadata, and automatic_payment_methods', async () => {
      const { paymentIntentsCreate } = getMocks()
      paymentIntentsCreate.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
      })

      await service.createPaymentIntent(150000, 'vnd', { orderId: 'order_1', userId: 'user_1' })

      expect(paymentIntentsCreate).toHaveBeenCalledWith({
        amount: 150000,
        currency: 'vnd',
        metadata: { orderId: 'order_1', userId: 'user_1' },
        automatic_payment_methods: { enabled: true },
      })
    })

    // ─── 1.3 createPaymentIntent — return shape ───────────────────────────────

    it('returns { clientSecret, paymentIntentId } from Stripe response', async () => {
      const { paymentIntentsCreate } = getMocks()
      paymentIntentsCreate.mockResolvedValue({
        id: 'pi_test_456',
        client_secret: 'pi_test_456_secret_xyz',
      })

      const result = await service.createPaymentIntent(50000, 'vnd', { orderId: 'order_2' })

      expect(result).toEqual({
        clientSecret: 'pi_test_456_secret_xyz',
        paymentIntentId: 'pi_test_456',
      })
    })
  })

  // ─── 1.4 retrievePaymentIntent ────────────────────────────────────────────

  describe('retrievePaymentIntent', () => {
    it('calls stripe.paymentIntents.retrieve with the given ID and returns the result', async () => {
      const { paymentIntentsRetrieve } = getMocks()
      const mockPaymentIntent = { id: 'pi_test_789', status: 'succeeded' }
      paymentIntentsRetrieve.mockResolvedValue(mockPaymentIntent)

      const result = await service.retrievePaymentIntent('pi_test_789')

      expect(paymentIntentsRetrieve).toHaveBeenCalledWith('pi_test_789')
      expect(result).toEqual(mockPaymentIntent)
    })
  })

  // ─── 1.5 constructWebhookEvent — happy path ───────────────────────────────

  describe('constructWebhookEvent', () => {
    it('calls stripe.webhooks.constructEvent with rawBody Buffer, signature, and STRIPE_WEBHOOK_SECRET', () => {
      const { webhooksConstructEvent } = getMocks()
      const mockEvent = { id: 'evt_test_001', type: 'payment_intent.succeeded' }
      webhooksConstructEvent.mockReturnValue(mockEvent)

      const rawBody = Buffer.from('{"id":"evt_test_001"}')
      const signature = 't=1234,v1=abc'

      const result = service.constructWebhookEvent(rawBody, signature)

      expect(webhooksConstructEvent).toHaveBeenCalledWith(
        rawBody,
        signature,
        'whsec_test_mock',
      )
      expect(result).toEqual(mockEvent)
    })

    // ─── 1.6 constructWebhookEvent — error propagation ────────────────────────

    it('propagates error when stripe.webhooks.constructEvent throws', () => {
      const { webhooksConstructEvent } = getMocks()
      webhooksConstructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature for payload')
      })

      const rawBody = Buffer.from('tampered_body')
      const signature = 'invalid_sig'

      expect(() => service.constructWebhookEvent(rawBody, signature)).toThrow(
        'No signatures found matching the expected signature for payload',
      )
    })
  })

  // ─── 1.7 cancelPaymentIntent ─────────────────────────────────────────────

  describe('cancelPaymentIntent', () => {
    it('calls stripe.paymentIntents.cancel with the given ID and returns the result', async () => {
      const { paymentIntentsCancel } = getMocks()
      const mockCancelled = { id: 'pi_test_999', status: 'canceled' }
      paymentIntentsCancel.mockResolvedValue(mockCancelled)

      const result = await service.cancelPaymentIntent('pi_test_999')

      expect(paymentIntentsCancel).toHaveBeenCalledWith('pi_test_999')
      expect(result).toEqual(mockCancelled)
    })
  })
})
