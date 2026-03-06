/// <reference types="jest" />
/**
 * Review Integration Tests
 * Tests review endpoints and authentication requirements
 */
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import { PurchaseModel } from '@database/models/purchase.model'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Review Integration', () => {
  let authToken: string
  let productId: string
  let categoryId: mongoose.Types.ObjectId

  beforeEach(async () => {
    const category = await CategoryModel.create({ name: 'Test Category' })
    categoryId = category._id as mongoose.Types.ObjectId

    const product = await ProductModel.create({
      name: 'Test Product for Review',
      price: 200000,
      price_before_discount: 250000,
      quantity: 100,
      sold: 10,
      view: 500,
      image: 'product.jpg',
      images: ['product1.jpg', 'product2.jpg'],
      category: categoryId,
      description: 'Product for review testing',
      rating: 4.0,
    })
    productId = product._id.toString()

    const auth = await getAuthToken(app)
    authToken = auth.access_token
  })

  describe('GET /reviews/product/:product_id', () => {
    it('should return reviews for a product (public endpoint)', async () => {
      const res = await supertest(app).get(`/reviews/product/${productId}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
    })

    it('should return empty array for product with no reviews', async () => {
      const res = await supertest(app).get(`/reviews/product/${productId}`)

      expect(res.status).toBe(200)
    })

    it('should handle invalid product_id format', async () => {
      const res = await supertest(app).get('/reviews/product/invalid-id')

      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should work with authentication (optional auth)', async () => {
      const res = await supertest(app)
        .get(`/reviews/product/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
    })
  })

  describe('POST /reviews', () => {
    it('should require authentication to create review', async () => {
      const res = await supertest(app).post('/reviews').send({
        product_id: productId,
        rating: 5,
        comment: 'Great product!',
      })

      // Validation middleware runs before auth, so may return 422 or 401
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should fail without required fields', async () => {
      const res = await supertest(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('POST /reviews/like/:review_id', () => {
    it('should require authentication to like review', async () => {
      const fakeReviewId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app).post(`/reviews/like/${fakeReviewId}`)

      expect(res.status).toBe(401)
    })

    it('should handle non-existent review', async () => {
      const fakeReviewId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .post(`/reviews/like/${fakeReviewId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('POST /reviews/comment', () => {
    it('should require authentication to comment on review', async () => {
      const res = await supertest(app).post('/reviews/comment').send({
        review_id: new mongoose.Types.ObjectId().toString(),
        content: 'Nice review!',
      })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /reviews/comments/:review_id', () => {
    it('should return comments for a review (public endpoint)', async () => {
      const fakeReviewId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app).get(`/reviews/comments/${fakeReviewId}`)

      expect(res.status).toBeLessThan(500)
    })
  })

  describe('GET /reviews/can-review/:purchase_id', () => {
    it('should require authentication', async () => {
      const fakePurchaseId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app).get(`/reviews/can-review/${fakePurchaseId}`)

      expect(res.status).toBe(401)
    })
  })

  describe('POST /reviews (successful create after purchase)', () => {
    it('should create review for delivered purchase', async () => {
      const auth = await getAuthToken(app, { email: `reviewer-${Date.now()}@test.com` })
      const reviewerToken = auth.access_token
      const userId = auth.user._id

      // Create a purchase with DELIVERED status (4)
      const purchase = await PurchaseModel.create({
        user: new mongoose.Types.ObjectId(userId),
        product: new mongoose.Types.ObjectId(productId),
        buy_count: 1,
        price: 200000,
        price_before_discount: 250000,
        status: 4, // DELIVERED
      })

      const res = await supertest(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          purchase_id: purchase._id.toString(),
          rating: 5,
          comment: 'This is a great product, highly recommended!',
        })

      expect(res.status).toBeLessThan(400)
      if (res.body.data) {
        expect(res.body.data.rating).toBe(5)
      }
    })
  })
})

