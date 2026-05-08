/**
 * Migration/seed script to populate payment_methods collection with existing
 * static payment methods and add is_active / sort_order / type fields.
 *
 * Run via: ts-node src/database/migrations/seed-payment-methods.ts
 */
import mongoose from 'mongoose'
import { PaymentMethodModel } from '@database/models/payment-method.model'

const INITIAL_PAYMENT_METHODS = [
  {
    name: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán bằng tiền mặt khi nhận hàng',
    icon: 'banknote',
    type: 'cod',
    is_active: true,
    sort_order: 1,
  },
  {
    name: 'Chuyển khoản ngân hàng',
    description: 'Chuyển khoản qua tài khoản ngân hàng',
    icon: 'landmark',
    type: 'bank_transfer',
    is_active: true,
    sort_order: 2,
    instructions: 'Vui lòng chuyển khoản đến tài khoản ngân hàng được cung cấp sau khi đặt hàng.',
  },
  {
    name: 'Ví điện tử',
    description: 'Thanh toán qua MoMo, ZaloPay, VNPay',
    icon: 'smartphone',
    type: 'e_wallet',
    is_active: true,
    sort_order: 3,
  },
  {
    name: 'Thẻ tín dụng/Ghi nợ',
    description: 'Visa, Mastercard, JCB',
    icon: 'credit-card',
    type: 'credit_card',
    is_active: true,
    sort_order: 4,
  },
]

export async function seedPaymentMethods() {
  const count = await PaymentMethodModel.countDocuments()
  if (count > 0) {
    console.log(`Payment methods already seeded (${count} records). Skipping.`)
    return
  }
  await PaymentMethodModel.insertMany(INITIAL_PAYMENT_METHODS)
  console.log(`Seeded ${INITIAL_PAYMENT_METHODS.length} payment methods.`)
}

// Allow running directly
if (require.main === module) {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopee'
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      await seedPaymentMethods()
      await mongoose.disconnect()
    })
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
