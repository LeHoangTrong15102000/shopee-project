/// <reference types="jest" />
import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { clearTestDB } from '../helpers/db-setup'
import { getAuthToken } from '../helpers/auth-helper'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import { PurchaseModel } from '@database/models/purchase.model'
import { STATUS_PURCHASE } from '@constants/purchase'
import './setup'

const app = createTestApp()

describe('Review and Social Flow E2E', () => {
  let productId: string
  let accessToken: string
  let userId: string

  beforeEach(async () => {
    await clearTestDB()
    // Seed category and product
    const category = await CategoryModel.create({ name: 'Electronics' })
    const product = await ProductModel.create({
      name: 'Review Test Product',
      image: 'https://example.com/product.jpg',
      images: [],
      description: 'Product for review testing',
      category: category._id,
      price: 500000,
      quantity: 100,
    })
    productId = product._id.toString()
  })

  describe('Review endpoint existence', () => {
    it('should return reviews for a product (empty initially)', async () => {
      const reviewsRes = await supertest(app)
        .get(`/reviews/product/${productId}`)
      expect(reviewsRes.status).toBe(200)
      expect(reviewsRes.body.data).toHaveProperty('reviews')
      expect(Array.isArray(reviewsRes.body.data.reviews)).toBe(true)
    })

    it('should return 400/404 for invalid product id', async () => {
      const reviewsRes = await supertest(app)
        .get('/reviews/product/invalid-id')
      expect(reviewsRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Review authentication', () => {
    it('should require authentication to create review', async () => {
      const reviewRes = await supertest(app)
        .post('/reviews')
        .send({
          product_id: productId,
          purchase_id: '507f1f77bcf86cd799439011',
          rating: 5,
          comment: 'Great product!',
        })
      expect(reviewRes.status).toBe(401)
    })

    it('should require valid purchase to create review', async () => {
      const auth = await getAuthToken(app)

      const reviewRes = await supertest(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({
          product_id: productId,
          purchase_id: '507f1f77bcf86cd799439011',
          rating: 5,
          comment: 'Great product!',
        })
      // Should fail because purchase doesn't exist or isn't delivered
      expect(reviewRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Review validation', () => {
    it('should validate rating range (1-5)', async () => {
      const auth = await getAuthToken(app)

      const reviewRes = await supertest(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({
          product_id: productId,
          purchase_id: '507f1f77bcf86cd799439011',
          rating: 10, // Invalid rating
          comment: 'Great product!',
        })
      expect(reviewRes.status).toBeGreaterThanOrEqual(400)
    })

    it('should require comment for review', async () => {
      const auth = await getAuthToken(app)

      const reviewRes = await supertest(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({
          product_id: productId,
          purchase_id: '507f1f77bcf86cd799439011',
          rating: 5,
          // Missing comment
        })
      expect(reviewRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Review with delivered purchase', () => {
    it('should allow review after purchase is delivered', async () => {
      const auth = await getAuthToken(app)

      // Create a delivered purchase directly in DB
      const purchase = await PurchaseModel.create({
        user: auth.user._id,
        product: productId,
        buy_count: 1,
        price: 500000,
        status: STATUS_PURCHASE.DELIVERED,
      })

      const reviewRes = await supertest(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({
          product_id: productId,
          purchase_id: purchase._id.toString(),
          rating: 5,
          comment: 'Excellent product! Highly recommended.',
        })
      expect(reviewRes.status).toBe(200)

      // Verify review appears in product reviews
      const reviewsRes = await supertest(app)
        .get(`/reviews/product/${productId}`)
      expect(reviewsRes.status).toBe(200)
      expect(reviewsRes.body.data.reviews.length).toBeGreaterThan(0)
    })
  })

  describe('Can review check', () => {
    it('should check if user can review a purchase', async () => {
      const auth = await getAuthToken(app)

      const purchase = await PurchaseModel.create({
        user: auth.user._id,
        product: productId,
        buy_count: 1,
        price: 500000,
        status: STATUS_PURCHASE.DELIVERED,
      })

      const canReviewRes = await supertest(app)
        .get(`/reviews/can-review/${purchase._id.toString()}`)
        .set('Authorization', `Bearer ${auth.access_token}`)
      expect(canReviewRes.status).toBe(200)
      expect(canReviewRes.body.data).toHaveProperty('can_review')
    })
  })
})

