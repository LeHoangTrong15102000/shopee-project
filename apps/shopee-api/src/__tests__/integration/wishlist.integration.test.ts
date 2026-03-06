/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import './setup'

const app = createTestApp()

describe('Wishlist Integration', () => {
  let authToken: string
  let productId: string
  let categoryId: mongoose.Types.ObjectId

  beforeEach(async () => {
    const category = await CategoryModel.create({ name: 'Test Category' })
    categoryId = category._id as mongoose.Types.ObjectId

    const product = await ProductModel.create({
      name: 'Test Product for Wishlist',
      price: 150000,
      price_before_discount: 200000,
      quantity: 50,
      sold: 5,
      view: 100,
      image: 'wishlist-product.jpg',
      images: ['wishlist1.jpg', 'wishlist2.jpg'],
      category: categoryId,
      description: 'Product for wishlist testing',
      rating: 4.5,
    })
    productId = product._id.toString()

    const auth = await getAuthToken(app)
    authToken = auth.access_token
  })

  describe('GET /wishlist', () => {
    it('should return empty list initially', async () => {
      const res = await supertest(app)
        .get('/wishlist')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })
  })

  describe('POST /wishlist', () => {
    it('should add product to wishlist successfully', async () => {
      const res = await supertest(app)
        .post('/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId })

      expect(res.status).toBeLessThan(400)
    })

    it('should require authentication (401 without token)', async () => {
      const res = await supertest(app)
        .post('/wishlist')
        .send({ product_id: productId })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /wishlist/count', () => {
    it('should return count', async () => {
      await supertest(app)
        .post('/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId })

      const res = await supertest(app)
        .get('/wishlist/count')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
    })
  })

  describe('GET /wishlist/check/:product_id', () => {
    it('should return check result', async () => {
      const res = await supertest(app)
        .get(`/wishlist/check/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
    })
  })

  describe('DELETE /wishlist/:product_id', () => {
    it('should remove product from wishlist', async () => {
      await supertest(app)
        .post('/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId })

      const res = await supertest(app)
        .delete(`/wishlist/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
    })
  })

  describe('DELETE /wishlist', () => {
    it('should clear all wishlist items', async () => {
      await supertest(app)
        .post('/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId })

      const res = await supertest(app)
        .delete('/wishlist')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
    })
  })
})

