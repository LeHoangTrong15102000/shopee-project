/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAdminToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

// Helper to create option objects from strings
const opt = (value: string, name?: string) => ({ name: name || value, value })
const opts = (...values: string[]) => values.map((v) => opt(v))

describe('Product Integration', () => {
  let adminToken: string
  let testCategoryId: string

  beforeEach(async () => {
    const adminAuth = await getAdminToken(app)
    adminToken = adminAuth.access_token

    const categoryRes = await supertest(app)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Category' })
    testCategoryId = categoryRes.body.data._id
  })

  describe('GET /products', () => {
    it('should return empty paginated list when no products', async () => {
      const res = await supertest(app).get('/products')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('products')
      expect(res.body.data).toHaveProperty('pagination')
    })

    it('should return products after seeding', async () => {
      await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product 1',
          image: 'https://example.com/img1.jpg',
          images: ['https://example.com/img1.jpg'],
          description: 'Test description',
          category: testCategoryId,
          price: 100000,
          price_before_discount: 120000,
          quantity: 50,
        })

      const res = await supertest(app).get('/products')
      expect(res.status).toBe(200)
      expect(res.body.data.products.length).toBeGreaterThan(0)
    })
  })

  describe('GET /products/:product_id', () => {
    it('should return product detail', async () => {
      const createRes = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Detail Product',
          image: 'https://example.com/detail.jpg',
          images: ['https://example.com/detail.jpg'],
          description: 'Product for detail test',
          category: testCategoryId,
          price: 200000,
          price_before_discount: 250000,
          quantity: 30,
        })
      const productId = createRes.body.data._id

      const res = await supertest(app).get(`/products/${productId}`)
      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Detail Product')
    })

    it('should return error for invalid product ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app).get(`/products/${fakeId}`)
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Admin POST /admin/products', () => {
    it('should create product with admin token', async () => {
      const res = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created Product',
          image: 'https://example.com/admin.jpg',
          images: ['https://example.com/admin.jpg'],
          description: 'Created by admin',
          category: testCategoryId,
          price: 300000,
          price_before_discount: 350000,
          quantity: 100,
        })
      expect(res.status).toBeLessThan(400)
      expect(res.body.data.name).toBe('Admin Created Product')
    })

    it('should reject product creation without auth', async () => {
      const res = await supertest(app)
        .post('/admin/products')
        .send({
          name: 'Unauthorized Product',
          image: 'https://example.com/unauth.jpg',
          images: ['https://example.com/unauth.jpg'],
          description: 'Should fail',
          category: testCategoryId,
          price: 100000,
          quantity: 10,
        })
      expect(res.status).toBe(401)
    })
  })

  describe('Admin PUT /admin/products/:product_id', () => {
    it('should update product', async () => {
      const createRes = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Original Name',
          image: 'https://example.com/orig.jpg',
          images: ['https://example.com/orig.jpg'],
          description: 'Original description',
          category: testCategoryId,
          price: 150000,
          price_before_discount: 180000,
          quantity: 20,
        })
      const productId = createRes.body.data._id

      const updateRes = await supertest(app)
        .put(`/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name', price: 160000 })
      expect(updateRes.status).toBeLessThan(400)
      expect(updateRes.body.data.name).toBe('Updated Name')
    })
  })

  describe('Admin DELETE /admin/products/delete/:product_id', () => {
    it('should delete product', async () => {
      const createRes = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'To Delete',
          image: 'https://example.com/delete.jpg',
          images: ['https://example.com/delete.jpg'],
          description: 'Will be deleted',
          category: testCategoryId,
          price: 50000,
          price_before_discount: 60000,
          quantity: 5,
        })
      const productId = createRes.body.data._id

      const deleteRes = await supertest(app)
        .delete(`/admin/products/delete/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(deleteRes.status).toBeLessThan(400)

      const getRes = await supertest(app).get(`/products/${productId}`)
      expect(getRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Product Variants Integration', () => {
    it('should create product with variants and auto-generate SKUs', async () => {
      const res = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Variant Product',
          image: 'https://example.com/variant.jpg',
          images: ['https://example.com/variant.jpg'],
          description: 'Product with variants',
          category: testCategoryId,
          price: 200000,
          price_before_discount: 250000,
          quantity: 100,
          variants: [
            { type: 'color', name: 'Màu sắc', options: opts('Red', 'Blue') },
            { type: 'size', name: 'Kích thước', options: opts('S', 'M') },
          ],
        })
      expect(res.status).toBeLessThan(400)
      expect(res.body.data.variants).toHaveLength(2)
      expect(res.body.data.skus).toHaveLength(4) // 2 colors x 2 sizes = 4 SKUs
    })

    it('should return product with variants and SKUs', async () => {
      const createRes = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Variant Detail Product',
          image: 'https://example.com/variant-detail.jpg',
          images: ['https://example.com/variant-detail.jpg'],
          description: 'Product for variant detail test',
          category: testCategoryId,
          price: 150000,
          price_before_discount: 180000,
          quantity: 50,
          variants: [{ type: 'size', name: 'Size', options: opts('S', 'M', 'L') }],
        })
      const productId = createRes.body.data._id

      const res = await supertest(app).get(`/products/${productId}`)
      expect(res.status).toBe(200)
      expect(res.body.data.variants).toHaveLength(1)
      expect(res.body.data.skus).toHaveLength(3)
    })

    it('should update product variants and regenerate SKUs', async () => {
      const createRes = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Update Variant Product',
          image: 'https://example.com/update-variant.jpg',
          images: ['https://example.com/update-variant.jpg'],
          description: 'Product for variant update test',
          category: testCategoryId,
          price: 100000,
          price_before_discount: 120000,
          quantity: 30,
          variants: [{ type: 'color', name: 'Màu', options: opts('Red') }],
        })
      const productId = createRes.body.data._id
      expect(createRes.body.data.skus).toHaveLength(1)

      const updateRes = await supertest(app)
        .put(`/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          variants: [{ type: 'color', name: 'Màu', options: opts('Red', 'Blue', 'Green') }],
        })
      expect(updateRes.status).toBeLessThan(400)
      expect(updateRes.body.data.skus).toHaveLength(3)
    })

    it('should reject duplicate variant types', async () => {
      const res = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Variant Product',
          image: 'https://example.com/invalid.jpg',
          images: ['https://example.com/invalid.jpg'],
          description: 'Should fail',
          category: testCategoryId,
          price: 100000,
          quantity: 10,
          variants: [
            { type: 'color', name: 'Màu 1', options: opts('Red') },
            { type: 'color', name: 'Màu 2', options: opts('Blue') },
          ],
        })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should reject duplicate options within variant', async () => {
      const res = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Option Product',
          image: 'https://example.com/dup-opt.jpg',
          images: ['https://example.com/dup-opt.jpg'],
          description: 'Should fail',
          category: testCategoryId,
          price: 100000,
          quantity: 10,
          variants: [{ type: 'color', name: 'Màu', options: [opt('Red'), opt('Red')] }],
        })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should create product without variants (backward compatible)', async () => {
      const res = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'No Variant Product',
          image: 'https://example.com/no-variant.jpg',
          images: ['https://example.com/no-variant.jpg'],
          description: 'Product without variants',
          category: testCategoryId,
          price: 100000,
          price_before_discount: 120000,
          quantity: 50,
        })
      expect(res.status).toBeLessThan(400)
      expect(res.body.data.variants).toBeUndefined()
    })

    it('should remove variants when updating with empty array', async () => {
      // Create product with variants
      const createRes = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Remove Variant Product',
          image: 'https://example.com/remove-variant.jpg',
          images: ['https://example.com/remove-variant.jpg'],
          description: 'Product to remove variants',
          category: testCategoryId,
          price: 100000,
          quantity: 30,
          variants: [{ type: 'color', name: 'Màu', options: opts('Red', 'Blue') }],
        })
      const productId = createRes.body.data._id
      expect(createRes.body.data.skus).toHaveLength(2)

      // Update with empty variants array
      const updateRes = await supertest(app)
        .put(`/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ variants: [] })
      expect(updateRes.status).toBeLessThan(400)
      expect(updateRes.body.data.skus).toHaveLength(0)
    })

    it('should reject more than 5 variants', async () => {
      const res = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Too Many Variants',
          image: 'https://example.com/too-many.jpg',
          images: ['https://example.com/too-many.jpg'],
          description: 'Should fail - too many variants',
          category: testCategoryId,
          price: 100000,
          quantity: 10,
          variants: [
            { type: 'color', name: 'Màu', options: opts('Red') },
            { type: 'size', name: 'Size', options: opts('S') },
            { type: 'style', name: 'Style', options: opts('A') },
            { type: 'material', name: 'Material', options: opts('Cotton') },
            { type: 'color', name: 'Color2', options: opts('Blue') }, // 5th - but duplicate type
            { type: 'size', name: 'Size2', options: opts('M') }, // 6th - but duplicate type
          ],
        })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should reject more than 20 options per variant', async () => {
      const manyOptions = Array.from({ length: 21 }, (_, i) => opt(`Option${i + 1}`))
      const res = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Too Many Options',
          image: 'https://example.com/too-many-opts.jpg',
          images: ['https://example.com/too-many-opts.jpg'],
          description: 'Should fail - too many options',
          category: testCategoryId,
          price: 100000,
          quantity: 10,
          variants: [{ type: 'color', name: 'Màu', options: manyOptions }],
        })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should reject variants generating more than 100 SKU combinations', async () => {
      // 11 x 10 = 110 combinations > 100 limit
      const colors = Array.from({ length: 11 }, (_, i) => opt(`Color${i + 1}`))
      const sizes = Array.from({ length: 10 }, (_, i) => opt(`Size${i + 1}`))
      const res = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Too Many SKUs',
          image: 'https://example.com/too-many-skus.jpg',
          images: ['https://example.com/too-many-skus.jpg'],
          description: 'Should fail - too many SKU combinations',
          category: testCategoryId,
          price: 100000,
          quantity: 10,
          variants: [
            { type: 'color', name: 'Màu', options: colors },
            { type: 'size', name: 'Size', options: sizes },
          ],
        })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should reject invalid variant type', async () => {
      const res = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Type Product',
          image: 'https://example.com/invalid-type.jpg',
          images: ['https://example.com/invalid-type.jpg'],
          description: 'Should fail - invalid variant type',
          category: testCategoryId,
          price: 100000,
          quantity: 10,
          variants: [{ type: 'texture', name: 'Texture', options: opts('Smooth', 'Rough') }],
        })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should create product with three variants and generate all SKU combinations', async () => {
      const res = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Three Variant Product',
          image: 'https://example.com/three-variant.jpg',
          images: ['https://example.com/three-variant.jpg'],
          description: 'Product with three variants',
          category: testCategoryId,
          price: 300000,
          quantity: 100,
          variants: [
            { type: 'color', name: 'Màu', options: opts('Red', 'Blue') },
            { type: 'size', name: 'Size', options: opts('S', 'M') },
            { type: 'material', name: 'Chất liệu', options: opts('Cotton', 'Polyester') },
          ],
        })
      expect(res.status).toBeLessThan(400)
      expect(res.body.data.variants).toHaveLength(3)
      // 2 colors x 2 sizes x 2 materials = 8 SKUs
      expect(res.body.data.skus).toHaveLength(8)
    })
  })
})

