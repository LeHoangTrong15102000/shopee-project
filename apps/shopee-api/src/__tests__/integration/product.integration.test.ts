/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAdminToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

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
})

