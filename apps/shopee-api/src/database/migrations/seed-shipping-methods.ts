/**
 * Migration/seed script to populate shipping_methods collection with existing
 * static shipping methods and add is_active / sort_order fields.
 *
 * Run via: ts-node src/database/migrations/seed-shipping-methods.ts
 */
import mongoose from 'mongoose'
import { ShippingMethodModel } from '@database/models/shipping-method.model'

const INITIAL_SHIPPING_METHODS = [
  {
    name: 'Giao hàng tiêu chuẩn',
    description: 'Giao hàng tiêu chuẩn từ 3 đến 5 ngày',
    price: 30000,
    estimated_days_min: 3,
    estimated_days_max: 5,
    icon: 'truck',
    is_active: true,
    sort_order: 1,
  },
  {
    name: 'Giao hàng nhanh',
    description: 'Giao hàng nhanh từ 1 đến 2 ngày',
    price: 50000,
    estimated_days_min: 1,
    estimated_days_max: 2,
    icon: 'zap',
    is_active: true,
    sort_order: 2,
  },
  {
    name: 'Giao hàng trong ngày',
    description: 'Giao hàng trong ngày, áp dụng nội thành',
    price: 80000,
    estimated_days_min: 0,
    estimated_days_max: 1,
    icon: 'package',
    is_active: true,
    sort_order: 3,
  },
]

export async function seedShippingMethods() {
  const count = await ShippingMethodModel.countDocuments()
  if (count > 0) {
    console.log(`Shipping methods already seeded (${count} records). Skipping.`)
    return
  }
  await ShippingMethodModel.insertMany(INITIAL_SHIPPING_METHODS)
  console.log(`Seeded ${INITIAL_SHIPPING_METHODS.length} shipping methods.`)
}

// Allow running directly
if (require.main === module) {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopee'
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      await seedShippingMethods()
      await mongoose.disconnect()
    })
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
