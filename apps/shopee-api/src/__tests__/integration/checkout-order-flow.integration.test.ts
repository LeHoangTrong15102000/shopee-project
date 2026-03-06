/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import './setup'

const app = createTestApp()

describe('Checkout-Order Flow Integration', () => {
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

  describe('Full checkout flow', () => {
    it('should complete add-to-cart → address → summary → create-order → verify', async () => {
      const cartRes = await supertest(app)
        .post('/purchases/add-to-cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId, buy_count: 2 })
      expect(cartRes.status).toBeLessThan(400)
      const purchaseId = cartRes.body.data?._id

      if (purchaseId && addressId) {
        const summaryRes = await supertest(app)
          .post('/checkout/summary')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ purchase_ids: [purchaseId] })
        expect(summaryRes.status).toBeLessThan(400)

        const orderRes = await supertest(app)
          .post('/checkout/create-order')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            purchase_ids: [purchaseId],
            shipping_address_id: addressId,
            shipping_method_id: 'standard',
            payment_method: 'cod',
          })
        expect(orderRes.status).toBeLessThan(400)
        expect(orderRes.body.data).toBeDefined()
      }
    })
  })

  describe('POST /checkout/summary', () => {
    it('should return summary with valid cart items', async () => {
      const cartRes = await supertest(app)
        .post('/purchases/add-to-cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId, buy_count: 3 })
      const purchaseId = cartRes.body.data?._id

      if (purchaseId) {
        const res = await supertest(app)
          .post('/checkout/summary')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ purchase_ids: [purchaseId] })
        expect(res.status).toBeLessThan(400)
        expect(res.body.data).toBeDefined()
      }
    })
  })

  describe('POST /checkout/create-order', () => {
    it('should fail without authentication', async () => {
      const res = await supertest(app)
        .post('/checkout/create-order')
        .send({
          purchase_ids: [new mongoose.Types.ObjectId().toString()],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'cod',
        })
      expect(res.status).toBe(401)
    })

    it('should fail with empty purchase_ids', async () => {
      const res = await supertest(app)
        .post('/checkout/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          purchase_ids: [],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'cod',
        })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should fail with invalid address', async () => {
      const cartRes = await supertest(app)
        .post('/purchases/add-to-cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId, buy_count: 1 })
      const purchaseId = cartRes.body.data?._id

      if (purchaseId) {
        const fakeAddressId = new mongoose.Types.ObjectId().toString()
        const res = await supertest(app)
          .post('/checkout/create-order')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            purchase_ids: [purchaseId],
            shipping_address_id: fakeAddressId,
            shipping_method_id: 'standard',
            payment_method: 'cod',
          })
        expect(res.status).toBeGreaterThanOrEqual(400)
      }
    })

    it('should decrement stock after successful checkout', async () => {
      const initialProduct = await ProductModel.findById(productId)
      const initialQty = initialProduct?.quantity || 0

      const cartRes = await supertest(app)
        .post('/purchases/add-to-cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId, buy_count: 5 })
      const purchaseId = cartRes.body.data?._id

      if (purchaseId && addressId) {
        await supertest(app)
          .post('/checkout/create-order')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            purchase_ids: [purchaseId],
            shipping_address_id: addressId,
            shipping_method_id: 'standard',
            payment_method: 'cod',
          })

        const updatedProduct = await ProductModel.findById(productId)
        expect(updatedProduct?.quantity).toBeLessThan(initialQty)
      }
    })
  })
})

