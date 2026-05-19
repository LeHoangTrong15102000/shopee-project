import Stripe from 'stripe'

// Stripe v22 uses `export = StripeConstructor` (CJS). With esModuleInterop the default
// import is StripeConstructor, not the Stripe class. Use InstanceType<typeof Stripe> for
// the instance type and Awaited<ReturnType<...>> to infer resource types without touching
// the Stripe namespace (which is a type alias, not a namespace, in this version).
type StripeInstance = InstanceType<typeof Stripe>
type PaymentIntentType = Awaited<ReturnType<StripeInstance['paymentIntents']['retrieve']>>
type EventType = ReturnType<StripeInstance['webhooks']['constructEvent']>
type RefundType = Awaited<ReturnType<StripeInstance['refunds']['retrieve']>>

export class StripeService {
  private _stripe: StripeInstance | null = null

  private get stripe(): StripeInstance {
    if (!this._stripe) {
      this._stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2026-04-22.dahlia', // required by stripe@22.x — update when upgrading SDK
      })
    }
    return this._stripe
  }

  /**
   * Create a PaymentIntent for a credit card order.
   *
   * IMPORTANT: VND is a zero-decimal currency. Pass the amount in full dong
   * (e.g., 150000 for 150,000 VND). Do NOT divide by 100.
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount, // VND: pass as-is (zero-decimal currency)
      currency, // 'vnd'
      metadata,
      automatic_payment_methods: { enabled: true },
    })

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntentType> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId)
  }

  /**
   * Verify and construct a Stripe webhook event from the raw request body.
   *
   * rawBody MUST be a Buffer (not parsed JSON). This requires express.raw()
   * middleware to be applied to the webhook route before express.json().
   */
  constructWebhookEvent(rawBody: Buffer, signature: string): EventType {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntentType> {
    return this.stripe.paymentIntents.cancel(paymentIntentId)
  }

  /**
   * Create a Stripe refund for a PaymentIntent.
   * VND is a zero-decimal currency — pass amount as-is (e.g., 150000 for 150,000 VND).
   */
  async createRefund(
    paymentIntentId: string,
    amount: number,
    metadata?: Record<string, string>,
  ): Promise<{ refundId: string; status: string }> {
    const refund = await this.stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        amount,
        reason: 'requested_by_customer',
        metadata,
      },
      {
        idempotencyKey: metadata?.idempotencyKey || `refund-${paymentIntentId}-${Date.now()}`,
      },
    )
    return { refundId: refund.id, status: refund.status! }
  }

  /**
   * Retrieve a Stripe refund by its ID.
   */
  async retrieveRefund(refundId: string): Promise<{ status: string; failureReason?: string }> {
    const refund: RefundType = await this.stripe.refunds.retrieve(refundId)
    return { status: refund.status!, failureReason: (refund as any).failure_reason || undefined }
  }
}
