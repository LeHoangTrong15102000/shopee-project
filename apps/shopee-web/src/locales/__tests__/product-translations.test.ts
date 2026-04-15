import { describe, it, expect } from 'vitest'
import viProductJson from 'src/locales/vi/product.json'
import enProductJson from 'src/locales/en/product.json'

describe('i18n Translations (Task 8.7)', () => {
  const requiredKeys = [
    // Cart validation
    'cart.validationError',
    'cart.validationErrorFull',
    // Voucher
    'voucher.shopDiscount',
    'voucher.modalTitle',
    'voucher.save',
    'voucher.saved',
    'voucher.seeMore',
    'voucher.noVouchers',
    'voucher.loadError',
    'voucher.saveSuccess',
    'voucher.saveError',
    'voucher.retry',
    'voucher.processing',
    'voucher.apply',
    'voucher.discount',
    'voucher.maxDiscount',
    'voucher.minOrder',
    'voucher.code',
    'voucher.expired',
    'voucher.expiringToday',
    'voucher.expiryDate',
    'voucher.expiredOverlay',
    'voucher.discountAmount',
    'voucher.discountPercent',
    // Shipping
    'shipping.label',
    'shipping.freeShipping',
    'shipping.defaultLocation',
    'shipping.deliverFrom',
    'shipping.estimatedDelivery',
    'shipping.modalTitle',
    'shipping.noMethods',
    'shipping.loadError',
    'shipping.retry',
    'shipping.free',
    'shipping.express',
    'shipping.estimatedTime',
    'shipping.estimatedDeliveryLabel',
    // Protection
    'protection.freeReturn',
    'protection.shopeeGuarantee',
    'protection.modalTitle',
    'protection.returnPolicy.title',
    'protection.returnPolicy.description',
    'protection.returnPolicy.condition1',
    'protection.returnPolicy.condition2',
    'protection.returnPolicy.process',
    'protection.authenticity.title',
    'protection.authenticity.description',
    'protection.authenticity.verification',
    'protection.authenticity.compensation',
    'protection.freeShippingPolicy.title',
    'protection.freeShippingPolicy.description',
    'protection.freeShippingPolicy.conditions',
    'protection.freeShippingPolicy.coverage',
    // Modal
    'modal.close',
  ]

  // Helper to get nested value from flat key
  const getNestedValue = (obj: Record<string, unknown>, key: string): unknown => {
    return (obj as Record<string, unknown>)[key]
  }

  describe('Vietnamese translations', () => {
    it.each(requiredKeys)('has key "%s"', (key) => {
      const value = getNestedValue(viProductJson, key)
      expect(value).toBeDefined()
      expect(typeof value).toBe('string')
      expect((value as string).length).toBeGreaterThan(0)
    })

    it('cart validation error has interpolation placeholders', () => {
      const val = viProductJson['cart.validationError'] as string
      expect(val).toContain('{{existing}}')
      expect(val).toContain('{{remaining}}')
    })

    it('cart validation full error has interpolation placeholder', () => {
      const val = viProductJson['cart.validationErrorFull'] as string
      expect(val).toContain('{{existing}}')
    })
  })

  describe('English translations', () => {
    it.each(requiredKeys)('has key "%s"', (key) => {
      const value = getNestedValue(enProductJson, key)
      expect(value).toBeDefined()
      expect(typeof value).toBe('string')
      expect((value as string).length).toBeGreaterThan(0)
    })

    it('cart validation error has interpolation placeholders', () => {
      const val = enProductJson['cart.validationError'] as string
      expect(val).toContain('{{existing}}')
      expect(val).toContain('{{remaining}}')
    })

    it('all Vietnamese keys have English counterparts', () => {
      const viKeys = Object.keys(viProductJson)
      const enKeys = Object.keys(enProductJson)
      const missingInEn = viKeys.filter((k) => !enKeys.includes(k))
      expect(missingInEn).toEqual([])
    })
  })
})
