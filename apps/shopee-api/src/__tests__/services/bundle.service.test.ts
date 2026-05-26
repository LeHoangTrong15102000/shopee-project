/// <reference types="jest" />
import { Types } from 'mongoose'
import { BundleService, CartItem } from '@services/bundle.service'
import { IBundle, BundleDiscountType } from '@database/models/bundle.model'

// Mock the BundleModel to avoid real DB calls in unit tests
jest.mock('@database/models/bundle.model', () => ({
  BundleModel: {
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
  },
  BundleDiscountType: {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
    BUY_X_GET_Y: 'buy_x_get_y',
  },
}))

function makeBundle(overrides: Partial<IBundle> = {}): IBundle {
  return {
    _id: new Types.ObjectId(),
    name: 'Test Bundle',
    productIds: [new Types.ObjectId(), new Types.ObjectId()],
    discountType: 'percentage' as BundleDiscountType,
    discountValue: 10,
    minQuantity: 1,
    isActive: true,
    currentRedemptions: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as IBundle
}

describe('BundleService.calculateBundleDiscount', () => {
  let service: BundleService

  beforeEach(() => {
    service = new BundleService()
  })

  const pid1 = new Types.ObjectId()
  const pid2 = new Types.ObjectId()

  const cartItems: CartItem[] = [
    { productId: pid1.toString(), quantity: 2, price: 100000 },
    { productId: pid2.toString(), quantity: 1, price: 50000 },
  ]

  describe('percentage discount', () => {
    it('applies percentage discount to bundle subtotal', () => {
      const bundle = makeBundle({
        productIds: [pid1, pid2],
        discountType: 'percentage' as BundleDiscountType,
        discountValue: 10,
      })

      const result = service.calculateBundleDiscount([bundle], cartItems)

      // subtotal = 2*100000 + 1*50000 = 250000; 10% = 25000
      expect(result).not.toBeNull()
      expect(result!.discountAmount).toBe(25000)
      expect(result!.discountedTotal).toBe(250000 - 25000)
    })

    it('returns null when no bundles match the cart', () => {
      const unrelatedBundle = makeBundle({
        productIds: [new Types.ObjectId(), new Types.ObjectId()],
      })

      const result = service.calculateBundleDiscount([unrelatedBundle], cartItems)
      expect(result).toBeNull()
    })
  })

  describe('fixed discount', () => {
    it('applies fixed discount capped at bundle subtotal', () => {
      const bundle = makeBundle({
        productIds: [pid1, pid2],
        discountType: 'fixed' as BundleDiscountType,
        discountValue: 30000,
      })

      const result = service.calculateBundleDiscount([bundle], cartItems)

      expect(result).not.toBeNull()
      expect(result!.discountAmount).toBe(30000)
    })

    it('caps fixed discount at bundle subtotal when discount exceeds it', () => {
      const bundle = makeBundle({
        productIds: [pid1, pid2],
        discountType: 'fixed' as BundleDiscountType,
        discountValue: 999999,
      })

      const result = service.calculateBundleDiscount([bundle], cartItems)

      // subtotal = 250000; discount capped at 250000
      expect(result!.discountAmount).toBe(250000)
      expect(result!.discountedTotal).toBe(0)
    })
  })

  describe('buy_x_get_y discount', () => {
    it('gives cheapest items free based on discountValue count', () => {
      const bundle = makeBundle({
        productIds: [pid1, pid2],
        discountType: 'buy_x_get_y' as BundleDiscountType,
        discountValue: 1, // 1 free item (cheapest)
      })

      const result = service.calculateBundleDiscount([bundle], cartItems)

      // Items: [100000, 100000, 50000] sorted asc: [50000, 100000, 100000]
      // 1 free = cheapest = 50000
      expect(result).not.toBeNull()
      expect(result!.discountAmount).toBe(50000)
    })

    it('gives multiple cheapest items free', () => {
      const bundle = makeBundle({
        productIds: [pid1, pid2],
        discountType: 'buy_x_get_y' as BundleDiscountType,
        discountValue: 2, // 2 free items
      })

      const result = service.calculateBundleDiscount([bundle], cartItems)

      // sorted: [50000, 100000, 100000]; 2 free = 50000 + 100000 = 150000
      expect(result!.discountAmount).toBe(150000)
    })
  })

  describe('bundle eligibility checks', () => {
    it('skips bundle when minQuantity is not met', () => {
      const bundle = makeBundle({
        productIds: [pid1, pid2],
        discountType: 'percentage' as BundleDiscountType,
        discountValue: 10,
        minQuantity: 10, // requires 10 items total
      })

      const result = service.calculateBundleDiscount([bundle], cartItems)
      // cart has 3 items total (2 + 1), less than 10
      expect(result).toBeNull()
    })

    it('skips bundle when maxRedemptions is reached', () => {
      const bundle = makeBundle({
        productIds: [pid1, pid2],
        discountType: 'percentage' as BundleDiscountType,
        discountValue: 10,
        maxRedemptions: 5,
        currentRedemptions: 5,
      })

      const result = service.calculateBundleDiscount([bundle], cartItems)
      expect(result).toBeNull()
    })

    it('skips bundle when a required product is missing from cart', () => {
      const missingPid = new Types.ObjectId()
      const bundle = makeBundle({
        productIds: [pid1, missingPid],
        discountType: 'percentage' as BundleDiscountType,
        discountValue: 10,
      })

      const result = service.calculateBundleDiscount([bundle], cartItems)
      expect(result).toBeNull()
    })

    it('selects the bundle with the highest discount when multiple apply', () => {
      const lowBundle = makeBundle({
        productIds: [pid1, pid2],
        discountType: 'fixed' as BundleDiscountType,
        discountValue: 10000,
      })
      const highBundle = makeBundle({
        productIds: [pid1, pid2],
        discountType: 'fixed' as BundleDiscountType,
        discountValue: 50000,
      })

      const result = service.calculateBundleDiscount([lowBundle, highBundle], cartItems)

      expect(result!.discountAmount).toBe(50000)
      expect(result!.bundle.discountValue).toBe(50000)
    })
  })

  describe('empty inputs', () => {
    it('returns null for empty bundles array', () => {
      expect(service.calculateBundleDiscount([], cartItems)).toBeNull()
    })

    it('returns null for empty cart', () => {
      const bundle = makeBundle({ productIds: [pid1, pid2] })
      expect(service.calculateBundleDiscount([bundle], [])).toBeNull()
    })
  })
})
