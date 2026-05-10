import { Router } from 'express'
import { asyncHandler } from '@utils/async-handler'
import { stripeWebhook } from '@controllers/payment.controller'

const paymentRouter = Router()

/**
 * POST /payment/stripe/webhook
 *
 * Stripe webhook endpoint. Requires express.raw() middleware (registered in index.ts
 * before express.json()) so req.body is a raw Buffer for signature verification.
 * No auth middleware — Stripe authenticates via HMAC signature.
 */
paymentRouter.post('/stripe/webhook', asyncHandler(stripeWebhook))

export default paymentRouter
