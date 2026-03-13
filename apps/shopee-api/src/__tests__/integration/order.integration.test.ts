/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken, getAdminToken } from '../helpers/auth-helper'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import { SKUModel } from '@database/models/sku.model'
import './setup'

const app = createTestApp()

describe('Order Integration', () => {
  let authToken: string
  let productId: string
  let addressId: string
  let categoryId: mongoose.Types.ObjectId

  beforeEach(async () => {
    const category = await CategoryModel.create({ name: 'Test Category' })
    categoryId = category._id as mongoose.Types.ObjectId

    const product = await ProductModel.create({
      name: 'Test Product',
      price: 100000,
      price_before_discount: 120000,
      quantity: 50,
      sold: 0,
      view: 0,
      image: 'test.jpg',
      images: ['test.jpg'],
      category: categoryId,
      description: 'Test',
      rating: 4.5,
    })
    productId = product._id.toString()

    const auth = await getAuthToken(app)
    authToken = auth.access_token

    const addressRes = await supertest(app)
      .post('/addresses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        full_name: 'Test User',
        phone: '0901234567',
        province: 'HCM',
        district: 'Q1',
        ward: 'P1',
        street: '123 ABC',
      })
    addressId = addressRes.body.data?._id
  })

  describe('GET /orders/shipping/methods', () => {
    it('should return shipping methods without auth', async () => {
      const res = await supertest(app).get('/orders/shipping/methods')
      expect(res.status).toBeLessThan(400)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('GET /orders/payment/methods', () => {
    it('should return payment methods without auth', async () => {
      const res = await supertest(app).get('/orders/payment/methods')
      expect(res.status).toBeLessThan(400)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('POST /orders', () => {
    it('should create order successfully', async () => {
      const res = await supertest(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: productId, buy_count: 2 }],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'cod',
        })
      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })

    it('should fail without authentication', async () => {
      const res = await supertest(app)
        .post('/orders')
        .send({
          items: [{ product_id: productId, buy_count: 2 }],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'cod',
        })
      expect(res.status).toBe(401)
    })

    it('should fail with invalid address', async () => {
      const fakeAddressId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: productId, buy_count: 2 }],
          shipping_address_id: fakeAddressId,
          shipping_method_id: 'standard',
          payment_method: 'cod',
        })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('GET /orders', () => {
    it('should return empty orders list initially', async () => {
      const res = await supertest(app)
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })

    it('should return orders after creating one', async () => {
      await supertest(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: productId, buy_count: 1 }],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'cod',
        })

      const res = await supertest(app)
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeLessThan(400)
    })

    it('should fail without authentication', async () => {
      const res = await supertest(app).get('/orders')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /orders/:id', () => {
    it('should get order detail', async () => {
      const createRes = await supertest(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: productId, buy_count: 1 }],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'cod',
        })
      const orderId = createRes.body.data?._id
      expect(orderId).toBeDefined()

      const res = await supertest(app)
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })

    it('should fail with non-existent order ID', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app)
        .get(`/orders/${fakeOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('PUT /orders/:id/cancel', () => {
    it('should cancel pending order', async () => {
      const createRes = await supertest(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: productId, buy_count: 1 }],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'cod',
        })
      const orderId = createRes.body.data?._id
      expect(orderId).toBeDefined()

      const res = await supertest(app)
        .put(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Changed my mind' })
      expect(res.status).toBeLessThan(400)
    })

    it('should fail to cancel already cancelled order', async () => {
      const createRes = await supertest(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: productId, buy_count: 1 }],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'cod',
        })
      const orderId = createRes.body.data?._id
      expect(orderId).toBeDefined()

      await supertest(app)
        .put(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'First cancel' })

      const res = await supertest(app)
        .put(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Second cancel' })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })
})

describe('Order SKU Stock Sync Integration', () => {
  let authToken: string
  let productId: string
  let skuId1: string
  let skuId2: string
  let addressId: string

  beforeEach(async () => {
    const category = await CategoryModel.create({ name: 'Test Category' })
    const product = await ProductModel.create({
      name: 'Áo Thun Test',
      price: 100000,
      price_before_discount: 120000,
      quantity: 20, // Total: SKU1(10) + SKU2(10)
      sold: 0,
      view: 0,
      image: 'test.jpg',
      images: ['test.jpg'],
      category: category._id,
      description: 'Test product with SKUs',
      rating: 4.5,
    })
    productId = product._id.toString()

    const sku1 = await SKUModel.create({
      value: 'Đỏ-M',
      price: 100000,
      stock: 10,
      product: product._id,
      variant_values: { color: 'Đỏ', size: 'M' },
    })
    skuId1 = sku1._id.toString()

    const sku2 = await SKUModel.create({
      value: 'Xanh-L',
      price: 110000,
      stock: 10,
      product: product._id,
      variant_values: { color: 'Xanh', size: 'L' },
    })
    skuId2 = sku2._id.toString()

    const auth = await getAuthToken(app)
    authToken = auth.access_token

    const addressRes = await supertest(app)
      .post('/addresses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        full_name: 'Test User',
        phone: '0901234567',
        province: 'HCM',
        district: 'Q1',
        ward: 'P1',
        street: '123 ABC',
      })
    addressId = addressRes.body.data?._id
  })

  it('should create multi-SKU order and sync Product.quantity and Product.sold', async () => {
    const res = await supertest(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { product_id: productId, buy_count: 2, sku_id: skuId1 },
          { product_id: productId, buy_count: 3, sku_id: skuId2 },
        ],
        shipping_address_id: addressId,
        shipping_method_id: 'standard',
        payment_method: 'cod',
      })

    expect(res.status).toBeLessThan(400)

    // Verify SKU stock decremented
    const sku1After = await SKUModel.findById(skuId1)
    const sku2After = await SKUModel.findById(skuId2)
    expect(sku1After!.stock).toBe(8) // 10 - 2
    expect(sku2After!.stock).toBe(7) // 10 - 3

    // Verify Product.quantity synced
    const productAfter = await ProductModel.findById(productId)
    expect(productAfter!.quantity).toBe(15) // 20 - 2 - 3

    // Verify Product.sold incremented
    expect(productAfter!.sold).toBe(5) // 0 + 2 + 3
  })

  it('should restore both SKU and Product stock and sold on cancel', async () => {
    // Create order first
    const createRes = await supertest(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [{ product_id: productId, buy_count: 3, sku_id: skuId1 }],
        shipping_address_id: addressId,
        shipping_method_id: 'standard',
        payment_method: 'cod',
      })
    const orderId = createRes.body.data?._id
    expect(orderId).toBeDefined()

    // Cancel order
    await supertest(app)
      .put(`/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Changed mind' })

    // Verify stock restored
    const sku1After = await SKUModel.findById(skuId1)
    expect(sku1After!.stock).toBe(10) // Restored to original

    const productAfter = await ProductModel.findById(productId)
    expect(productAfter!.quantity).toBe(20) // Restored to original
    expect(productAfter!.sold).toBe(0) // Restored to original
  })

  it('should restore all SKU stocks and Product on multi-SKU cancel', async () => {
    // Create multi-SKU order
    const createRes = await supertest(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { product_id: productId, buy_count: 2, sku_id: skuId1 },
          { product_id: productId, buy_count: 3, sku_id: skuId2 },
        ],
        shipping_address_id: addressId,
        shipping_method_id: 'standard',
        payment_method: 'cod',
      })
    const orderId = createRes.body.data?._id
    expect(orderId).toBeDefined()

    // Cancel order
    await supertest(app)
      .put(`/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Changed mind' })

    // Verify all SKU stocks restored
    const sku1After = await SKUModel.findById(skuId1)
    const sku2After = await SKUModel.findById(skuId2)
    expect(sku1After!.stock).toBe(10) // Restored
    expect(sku2After!.stock).toBe(10) // Restored

    // Verify Product.quantity and Product.sold restored
    const productAfter = await ProductModel.findById(productId)
    expect(productAfter!.quantity).toBe(20) // Restored
    expect(productAfter!.sold).toBe(0) // Restored
  })

  it('should restore both SKU and Product stock and sold on return', async () => {
    // Get admin token for status transitions
    const adminAuth = await getAdminToken(app)

    // Create order
    const createRes = await supertest(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [{ product_id: productId, buy_count: 2, sku_id: skuId1 }],
        shipping_address_id: addressId,
        shipping_method_id: 'standard',
        payment_method: 'cod',
      })
    const orderId = createRes.body.data?._id
    expect(orderId).toBeDefined()

    // Transition order to DELIVERED via admin: confirmed → processing → shipping → delivered
    for (const status of ['confirmed', 'processing', 'shipping', 'delivered']) {
      await supertest(app)
        .put(`/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminAuth.access_token}`)
        .send({ status })
    }

    // Return order
    const returnRes = await supertest(app)
      .put(`/orders/${orderId}/return`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Defective product' })
    expect(returnRes.status).toBeLessThan(400)

    // Verify stock restored
    const sku1After = await SKUModel.findById(skuId1)
    expect(sku1After!.stock).toBe(10) // Restored to original

    const productAfter = await ProductModel.findById(productId)
    expect(productAfter!.quantity).toBe(20) // Restored to original
    expect(productAfter!.sold).toBe(0) // Restored to original
  })

  it('should rollback all SKUs on insufficient stock failure', async () => {
    const res = await supertest(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { product_id: productId, buy_count: 2, sku_id: skuId1 },
          { product_id: productId, buy_count: 15, sku_id: skuId2 }, // Exceeds stock of 10
        ],
        shipping_address_id: addressId,
        shipping_method_id: 'standard',
        payment_method: 'cod',
      })

    expect(res.status).toBeGreaterThanOrEqual(400)

    // Verify all stock unchanged (rollback worked)
    const sku1After = await SKUModel.findById(skuId1)
    const sku2After = await SKUModel.findById(skuId2)
    expect(sku1After!.stock).toBe(10) // Rolled back
    expect(sku2After!.stock).toBe(10) // Never decremented

    const productAfter = await ProductModel.findById(productId)
    expect(productAfter!.quantity).toBe(20) // Rolled back
  })
})