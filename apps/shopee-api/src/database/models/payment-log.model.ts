import mongoose, { Schema } from 'mongoose'

export interface IPaymentLog {
  _id: mongoose.Types.ObjectId
  order_id: mongoose.Types.ObjectId
  stripe_event_id: string        // idempotency key — unique per event
  stripe_event_type: string      // e.g. 'payment_intent.succeeded'
  stripe_payment_intent_id: string
  status: string                 // mirrors event outcome: 'succeeded' | 'failed' | 'canceled'
  raw_data: Record<string, unknown>  // full Stripe event object for audit
  created_at: Date
}

const PaymentLogSchema = new Schema<IPaymentLog>(
  {
    order_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'orders', required: true },
    stripe_event_id: { type: String, required: true, unique: true },
    stripe_event_type: { type: String, required: true },
    stripe_payment_intent_id: { type: String, required: true },
    status: { type: String, required: true },
    raw_data: { type: Schema.Types.Mixed, required: true },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
)

PaymentLogSchema.index({ order_id: 1 })
PaymentLogSchema.index({ stripe_payment_intent_id: 1 })
// stripe_event_id already indexed via unique: true

export const PaymentLogModel = mongoose.model<IPaymentLog>('payment_logs', PaymentLogSchema)
