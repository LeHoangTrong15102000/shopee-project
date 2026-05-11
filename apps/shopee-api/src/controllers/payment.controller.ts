import { Request, Response } from 'express'
import { stripeService } from '../container'
import { OrderModel, PAYMENT_STATUS } from '@database/models/order.model'
import { PaymentLogModel } from '@database/models/payment-log.model'
import { Logger } from '@utils/logger'
import { emitToUser } from '../socket/utils/emit'
import { SocketEvent } from '../@types/socket.type'

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

  const paymentIntent = (event.data.object as any)
  const paymentIntentId: string = paymentIntent.id
  const orderId: string | undefined = paymentIntent.metadata?.orderId

  let paymentStatus: string
  let orderStatus: string | undefined

  switch (event.type) {
    case 'payment_intent.succeeded':
      paymentStatus = PAYMENT_STATUS.PAID
      orderStatus = 'confirmed'
      break
    case 'payment_intent.payment_failed':
      paymentStatus = PAYMENT_STATUS.FAILED
      break
    case 'payment_intent.canceled':
      paymentStatus = PAYMENT_STATUS.FAILED
      break
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
