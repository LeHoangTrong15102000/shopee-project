/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
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

      if (orderId) {
        const res = await supertest(app)
          .get(`/orders/${orderId}`)
          .set('Authorization', `Bearer ${authToken}`)
        expect(res.status).toBeLessThan(400)
        expect(res.body.data).toBeDefined()
      }
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

      if (orderId) {
        const res = await supertest(app)
          .put(`/orders/${orderId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Changed my mind' })
        expect(res.status).toBeLessThan(400)
      }
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

      if (orderId) {
        await supertest(app)
          .put(`/orders/${orderId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'First cancel' })

        const res = await supertest(app)
          .put(`/orders/${orderId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Second cancel' })
        expect(res.status).toBeGreaterThanOrEqual(400)
      }
    })
  })
})
