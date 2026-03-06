import mongoose from 'mongoose'
import { ROLE } from '@constants/role.enum'
import { STATUS_PURCHASE } from '@constants/purchase'
import { DISCOUNT_TYPE } from '@database/models/voucher.model'

type PartialOverrides<T> = Partial<T>

export function createTestUser(overrides: PartialOverrides<Record<string, unknown>> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    email: `testuser_${Date.now()}@example.com`,
    name: 'Test User',
    password: 'hashedPassword123',
    date_of_birth: new Date('1990-01-15'),
    address: '123 Test Street, District 1, Ho Chi Minh City',
    phone: '0901234567',
    roles: [ROLE.USER],
    avatar: 'https://example.com/avatar.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createTestCategory(overrides: PartialOverrides<Record<string, unknown>> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Electronics',
    ...overrides,
  }
}

export function createTestProduct(overrides: PartialOverrides<Record<string, unknown>> = {}) {
  const categoryId = new mongoose.Types.ObjectId()
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Product',
    image: 'https://example.com/product-main.jpg',
    images: [
      'https://example.com/product-1.jpg',
      'https://example.com/product-2.jpg',
      'https://example.com/product-3.jpg',
    ],
    description: 'This is a test product description with detailed information.',
    category: categoryId,
    price: 500000,
    rating: 4.5,
    price_before_discount: 600000,
    quantity: 100,
    sold: 50,
    view: 1000,
    location: 'Ho Chi Minh City',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createTestPurchase(overrides: PartialOverrides<Record<string, unknown>> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    product: new mongoose.Types.ObjectId(),
    buy_count: 2,
    price: 500000,
    price_before_discount: 600000,
    status: STATUS_PURCHASE.IN_CART,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createTestVoucher(overrides: PartialOverrides<Record<string, unknown>> = {}) {
  const now = new Date()
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  return {
    _id: new mongoose.Types.ObjectId(),
    code: `VOUCHER${Date.now()}`,
    discount_type: DISCOUNT_TYPE.PERCENTAGE,
    discount_value: 10,
    min_order_value: 100000,
    max_discount: 50000,
    usage_limit: 100,
    used_count: 0,
    start_date: now,
    end_date: endDate,
    applicable_products: [],
    applicable_categories: [],
    is_active: true,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

export function createTestReview(overrides: PartialOverrides<Record<string, unknown>> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    product: new mongoose.Types.ObjectId(),
    purchase: new mongoose.Types.ObjectId(),
    rating: 5,
    comment: 'Great product! Highly recommended. Fast delivery and good quality.',
    images: ['https://example.com/review-1.jpg', 'https://example.com/review-2.jpg'],
    helpful_count: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

