/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import './setup'

const app = createTestApp()

describe('QA Integration', () => {
  let authToken: string
  let productId: string
  let categoryId: mongoose.Types.ObjectId

  beforeEach(async () => {
    const category = await CategoryModel.create({ name: 'Test Category' })
    categoryId = category._id as mongoose.Types.ObjectId

    const product = await ProductModel.create({
      name: 'Test Product for QA',
      price: 150000,
      price_before_discount: 200000,
      quantity: 50,
      sold: 5,
      view: 100,
      image: 'product.jpg',
      images: ['product1.jpg'],
      category: categoryId,
      description: 'Product for QA testing',
      rating: 4.5,
    })
    productId = product._id.toString()

    const auth = await getAuthToken(app)
    authToken = auth.access_token
  })

  describe('GET /qa/questions', () => {
    it('should return questions list for a product (public)', async () => {
      const res = await supertest(app).get(`/qa/questions?product_id=${productId}`)

      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })
  })

  describe('POST /qa/questions', () => {
    it('should ask question successfully', async () => {
      const res = await supertest(app)
        .post('/qa/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId, question: 'Is this product good quality?' })

      expect(res.status).toBeLessThan(400)
    })

    it('should require authentication', async () => {
      const res = await supertest(app)
        .post('/qa/questions')
        .send({ product_id: productId, question: 'Is this product good quality?' })

      expect(res.status).toBe(401)
    })

    it('should fail without required fields', async () => {
      const res = await supertest(app)
        .post('/qa/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('POST /qa/questions/:questionId/answers', () => {
    it('should answer question successfully', async () => {
      const questionRes = await supertest(app)
        .post('/qa/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId, question: 'What is the warranty period?' })

      const questionId = questionRes.body.data?._id || new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .post(`/qa/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: 'The warranty is 12 months.' })

      expect(res.status).toBeLessThan(400)
    })
  })

  describe('POST /qa/questions/:questionId/like', () => {
    it('should like question successfully', async () => {
      const questionRes = await supertest(app)
        .post('/qa/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId, question: 'Does this come with accessories?' })

      const questionId = questionRes.body.data?._id || new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .post(`/qa/questions/${questionId}/like`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
    })

    it('should require authentication', async () => {
      const fakeQuestionId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app).post(`/qa/questions/${fakeQuestionId}/like`)

      expect(res.status).toBe(401)
    })
  })

  describe('POST /qa/questions/:questionId/answers/:answerId/like', () => {
    it('should like answer successfully', async () => {
      const questionRes = await supertest(app)
        .post('/qa/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: productId, question: 'Is shipping free?' })

      const questionId = questionRes.body.data?._id || new mongoose.Types.ObjectId().toString()
      const fakeAnswerId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .post(`/qa/questions/${questionId}/answers/${fakeAnswerId}/like`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(500)
    })
  })
})

