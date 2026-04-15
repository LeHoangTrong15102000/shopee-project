/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import './setup'

const app = createTestApp()

describe('Price Integration', () => {
  let authToken: string
  let productId: string
  let categoryId: mongoose.Types.ObjectId

  beforeEach(async () => {
    const category = await CategoryModel.create({ name: 'Test Category' })
    categoryId = category._id as mongoose.Types.ObjectId

    const product = await ProductModel.create({
      name: 'Test Product for Price',
      price: 100000,
      price_before_discount: 150000,
      quantity: 50,
      sold: 10,
      view: 100,
      image: 'price-product.jpg',
      images: ['price1.jpg', 'price2.jpg'],
      category: categoryId,
      description: 'Product for price testing',
      rating: 4.0,
    })
    productId = product._id.toString()

    const auth = await getAuthToken(app)
    authToken = auth.access_token
  })

  describe('GET /products/:productId/price-history', () => {
    it('should return price history (may be empty)', async () => {
      const res = await supertest(app).get(`/products/${productId}/price-history`)

      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })
  })

  describe('GET /price-alerts', () => {
    it('should return list with authentication', async () => {
      const res = await supertest(app)
        .get('/price-alerts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })

    it('should require authentication (401)', async () => {
      const res = await supertest(app).get('/price-alerts')

      expect(res.status).toBe(401)
    })
  })

  describe('POST /price-alerts', () => {
    it('should create price alert', async () => {
      const res = await supertest(app)
        .post('/price-alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId, target_price: 80000 })

      expect(res.status).toBeLessThan(400)
    })
  })

  describe('DELETE /price-alerts/:alertId', () => {
    it('should handle non-existent alert', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .delete(`/price-alerts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      // Controller returns 200 even for non-existent alerts (idempotent delete)
      expect(res.status).toBeLessThan(500)
    })
  })
})
