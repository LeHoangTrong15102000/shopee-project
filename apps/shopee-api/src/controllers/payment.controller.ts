import { Request, Response } from 'express'
import Stripe from 'stripe'
import { stripeService, refundService } from '../container'
import { OrderModel, PAYMENT_STATUS } from '@database/models/order.model'
import { RefundModel, REFUND_STATUS } from '@database/models/refund.model'
import { PaymentLogModel } from '@database/models/payment-log.model'
import { Logger } from '@utils/logger'
import { emitToUser } from '../socket/utils/emit'
import { SocketEvent } from '../@types/socket.type'

// Stripe v22 uses `export = StripeConstructor` (CJS). The Stripe namespace does not
// auto-export resource types. Derive them from the instance API to stay type-safe.
type StripeInstance = InstanceType<typeof Stripe>
type StripePaymentIntent = Awaited<ReturnType<StripeInstance['paymentIntents']['retrieve']>>
type StripeCharge = Awaited<ReturnType<StripeInstance['charges']['retrieve']>>
type StripeRefund = Awaited<ReturnType<StripeInstance['refunds']['retrieve']>>

/**
 * Handle Stripe webhook events.
 *
 * The route MUST be registered with express.raw() middleware (not express.json())
 * so that req.body is a raw Buffer — required for Stripe signature verification.
 *
 * Always returns 200 to acknowledge receipt. Stripe retries on non-2xx responses.
 */
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string

  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header' })
    return
  }

  let event
  try {
    event = stripeService.constructWebhookEvent(req.body as Buffer, signature)
  } catch (err: any) {
    Logger.apiWarn('Stripe webhook signature verification failed', { error: err.message })
    res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` })
    return
  }

  // Idempotency check — skip if we've already processed this event
  const alreadyProcessed = await PaymentLogModel.exists({ stripe_event_id: event.id })
  if (alreadyProcessed) {
    Logger.apiInfo('Stripe webhook event already processed — skipping', { eventId: event.id })
    res.status(200).json({ received: true })
    return
  }

  let paymentIntentId: string = ''
  let orderId: string | undefined

  let paymentStatus: string
  let orderStatus: string | undefined

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as StripePaymentIntent
      paymentIntentId = paymentIntent.id
      orderId = paymentIntent.metadata?.orderId
      paymentStatus = PAYMENT_STATUS.PAID
      orderStatus = 'confirmed'
      break
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as StripePaymentIntent
      paymentIntentId = paymentIntent.id
      orderId = paymentIntent.metadata?.orderId
      paymentStatus = PAYMENT_STATUS.FAILED
      break
    }
    case 'payment_intent.canceled': {
      const paymentIntent = event.data.object as StripePaymentIntent
      paymentIntentId = paymentIntent.id
      orderId = paymentIntent.metadata?.orderId
      paymentStatus = PAYMENT_STATUS.FAILED
      break
    }
    case 'charge.refunded': {
      // Extract refund data from charge object — may contain multiple refunds
      const charge = event.data.object as StripeCharge
      const refunds = charge.refunds?.data || []
      for (const refundObj of refunds) {
        await handleStripeRefundUpdate(refundObj.id, refundObj.status ?? '', refundObj.failure_reason ?? undefined)
      }
      res.status(200).json({ received: true })
      return
    }
    case 'refund.updated': {
      const refundObj = event.data.object as StripeRefund
      await handleStripeRefundUpdate(refundObj.id, refundObj.status ?? '', refundObj.failure_reason ?? undefined)
      res.status(200).json({ received: true })
      return
    }
    case 'refund.failed': {
      const refundObj = event.data.object as StripeRefund
      await handleStripeRefundUpdate(refundObj.id, 'failed', refundObj.failure_reason ?? undefined)
      res.status(200).json({ received: true })
      return
    }
    default:
      // Unhandled event type — acknowledge and skip
      res.status(200).json({ received: true })
      return
  }

  try {
    // Update order payment status
    if (orderId) {
      const updateFields: Record<string, unknown> = {
        payment_status: paymentStatus,
        stripe_client_secret: null, // single-use — clear after payment resolves
      }
      if (orderStatus) {
        updateFields.status = orderStatus
      }
      if (paymentStatus === PAYMENT_STATUS.PAID) {
        updateFields.confirmed_at = new Date()
      }
      await OrderModel.findByIdAndUpdate(orderId, updateFields)

      // Emit real-time payment status update to the order owner
      const updatedOrder = await OrderModel.findById(orderId).select('user status').lean()
      if (updatedOrder) {
        emitToUser(updatedOrder.user.toString(), SocketEvent.PAYMENT_STATUS_UPDATED, {
          orderId: updatedOrder._id.toString(),
          payment_status: paymentStatus,
          order_status: orderStatus || updatedOrder.status,
        })
      }
    }

    // Record the event for idempotency and audit
    await PaymentLogModel.create({
      order_id: orderId || null,
      stripe_event_id: event.id,
      stripe_event_type: event.type,
      stripe_payment_intent_id: paymentIntentId,
      status: paymentStatus,
      raw_data: event as unknown as Record<string, unknown>,
    })

    Logger.apiInfo('Stripe webhook processed', {
      eventId: event.id,
      eventType: event.type,
      orderId,
      paymentStatus,
    })
  } catch (err: any) {
    Logger.apiError('Failed to process Stripe webhook event', {
      eventId: event.id,
      eventType: event.type,
      error: err.message,
    })
    // Return 200 even on processing errors to prevent Stripe from retrying.
    // The PaymentLog idempotency check is the safety net; reconciliation handles missed updates.
    res.status(200).json({ received: true, error: 'Internal error processing webhook' })
    return
  }

  res.status(200).json({ received: true })
}

/**
 * Handle a Stripe refund status update.
 * Finds the refund by gateway_refund_id and transitions it based on Stripe status.
 *
 * - succeeded: auto-complete the refund and set order payment_status = 'refunded'
 * - failed: revert to APPROVED so admin can retry; store failure_reason
 */
async function handleStripeRefundUpdate(
  stripeRefundId: string,
  status: string,
  failureReason?: string,
): Promise<void> {
  const refund = await RefundModel.findOne({ gateway_refund_id: stripeRefundId }).lean()
  if (!refund) {
    // Not our refund or already processed — silently skip
    return
  }

  if (status === 'succeeded' && refund.status === REFUND_STATUS.PROCESSING) {
    // Auto-complete the refund (also sets order payment_status via completeRefund)
    await refundService.completeRefund(refund._id.toString())

    Logger.apiInfo('[StripeWebhook] Refund auto-completed', {
      refundId: refund._id.toString(),
      stripeRefundId,
    })
  } else if (status === 'failed') {
    // Revert to APPROVED so admin can retry
    await RefundModel.findByIdAndUpdate(refund._id, {
      status: REFUND_STATUS.APPROVED,
      failure_reason: failureReason || 'Stripe refund failed',
    })

    Logger.apiError('[StripeWebhook] Stripe refund failed — reverted to APPROVED', {
      refundId: refund._id.toString(),
      stripeRefundId,
      failureReason,
    })
  }
}
