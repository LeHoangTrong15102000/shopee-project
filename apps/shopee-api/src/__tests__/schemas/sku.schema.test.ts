/// <reference types="jest" />
import { createSKUSchema, updateSKUSchema, skuIdParamSchema } from '@schemas/sku.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('SKU Schemas', () => {
  describe('createSKUSchema', () => {
    it('should accept valid input', () => {
      expect(createSKUSchema.safeParse({ body: { value: 'SKU-001', price: 100, stock: 50 } }).success).toBe(true)
    })
    it('should reject empty value', () => {
      expect(createSKUSchema.safeParse({ body: { value: '', price: 100, stock: 50 } }).success).toBe(false)
    })
    it('should reject negative price', () => {
      expect(createSKUSchema.safeParse({ body: { value: 'SKU-001', price: -1, stock: 50 } }).success).toBe(false)
    })
    it('should reject negative stock', () => {
      expect(createSKUSchema.safeParse({ body: { value: 'SKU-001', price: 100, stock: -1 } }).success).toBe(false)
    })
    it('should accept optional variant_values', () => {
      expect(createSKUSchema.safeParse({
        body: { value: 'SKU-001', price: 100, stock: 50, variant_values: { color: 'red' } }
      }).success).toBe(true)
    })
  })

  describe('updateSKUSchema', () => {
    it('should accept partial update', () => {
      expect(updateSKUSchema.safeParse({ body: { price: 200 } }).success).toBe(true)
    })
    it('should accept empty body (all optional)', () => {
      expect(updateSKUSchema.safeParse({ body: {} }).success).toBe(true)
    })
  })

  describe('skuIdParamSchema', () => {
    it('should accept valid sku_id', () => {
      expect(skuIdParamSchema.safeParse({ params: { sku_id: VALID_ID } }).success).toBe(true)
    })
    it('should reject invalid sku_id', () => {
      expect(skuIdParamSchema.safeParse({ params: { sku_id: 'bad' } }).success).toBe(false)
    })
  })
})
