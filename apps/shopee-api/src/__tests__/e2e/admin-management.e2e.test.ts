/// <reference types="jest" />
import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { clearTestDB } from '../helpers/db-setup'
import { getAdminToken } from '../helpers/auth-helper'
import { CategoryModel } from '@database/models/category.model'
import './setup'

const app = createTestApp()

describe('Admin Management Flow E2E', () => {
  let adminToken: string
  let categoryId: string
  let productId: string

  beforeEach(async () => {
    await clearTestDB()
  })

  describe('Admin authentication', () => {
    it('should login as admin', async () => {
      const adminAuth = await getAdminToken(app)
      expect(adminAuth.access_token).toBeDefined()
      expect(adminAuth.user.roles).toContain('Admin')
      adminToken = adminAuth.access_token
    })
  })

  describe('Category management', () => {
    it('should create a new category', async () => {
      const adminAuth = await getAdminToken(app)
      adminToken = adminAuth.access_token

      const categoryRes = await supertest(app)
        .post('/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Electronics Category' })
      expect(categoryRes.status).toBe(200)
      expect(categoryRes.body.data).toHaveProperty('_id')
      expect(categoryRes.body.data.name).toBe('New Electronics Category')
      categoryId = categoryRes.body.data._id
    })

    it('should get all categories', async () => {
      const adminAuth = await getAdminToken(app)
      await CategoryModel.create({ name: 'Test Category' })

      const categoriesRes = await supertest(app)
        .get('/admin/categories')
        .set('Authorization', `Bearer ${adminAuth.access_token}`)
      expect(categoriesRes.status).toBe(200)
      expect(Array.isArray(categoriesRes.body.data)).toBe(true)
    })
  })

  describe('Product management', () => {
    it('should create a new product', async () => {
      const adminAuth = await getAdminToken(app)
      const category = await CategoryModel.create({ name: 'Admin Test Category' })

      const productRes = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminAuth.access_token}`)
        .send({
          name: 'Admin Created Product',
          image: 'https://example.com/admin-product.jpg',
          images: ['https://example.com/img1.jpg'],
          description: 'Product created by admin',
          category: category._id.toString(),
          price: 2000000,
          price_before_discount: 2500000,
          quantity: 100,
        })
      expect(productRes.status).toBe(200)
      expect(productRes.body.data).toHaveProperty('_id')
      productId = productRes.body.data._id
    })

    it('should update product price', async () => {
      const adminAuth = await getAdminToken(app)
      const category = await CategoryModel.create({ name: 'Update Test Category' })

      // Create product first
      const createRes = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminAuth.access_token}`)
        .send({
          name: 'Product to Update',
          image: 'https://example.com/update-product.jpg',
          category: category._id.toString(),
          price: 1000000,
          quantity: 50,
        })
      const createdProductId = createRes.body.data._id

      // Update price
      const updateRes = await supertest(app)
        .put(`/admin/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminAuth.access_token}`)
        .send({ price: 1500000 })
      expect(updateRes.status).toBe(200)
      expect(updateRes.body.data.price).toBe(1500000)
    })

    it('should delete a product', async () => {
      const adminAuth = await getAdminToken(app)
      const category = await CategoryModel.create({ name: 'Delete Test Category' })

      // Create product first
      const createRes = await supertest(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminAuth.access_token}`)
        .send({
          name: 'Product to Delete',
          image: 'https://example.com/delete-product.jpg',
          category: category._id.toString(),
          price: 500000,
          quantity: 10,
        })
      const productToDeleteId = createRes.body.data._id

      // Delete product
      const deleteRes = await supertest(app)
        .delete(`/admin/products/delete/${productToDeleteId}`)
        .set('Authorization', `Bearer ${adminAuth.access_token}`)
      expect(deleteRes.status).toBe(200)

      // Verify product is deleted
      const getRes = await supertest(app)
        .get(`/admin/products/${productToDeleteId}`)
        .set('Authorization', `Bearer ${adminAuth.access_token}`)
      expect(getRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('User management', () => {
    it('should get all users', async () => {
      const adminAuth = await getAdminToken(app)

      const usersRes = await supertest(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminAuth.access_token}`)
      expect(usersRes.status).toBe(200)
      expect(Array.isArray(usersRes.body.data)).toBe(true)
      expect(usersRes.body.data.length).toBeGreaterThan(0)
    })

    it('should deny access to non-admin users', async () => {
      // Register regular user
      const email = `regular-${Date.now()}@test.com`
      await supertest(app).post('/register').send({ email, password: 'Test123456!' })
      const loginRes = await supertest(app).post('/login').send({ email, password: 'Test123456!' })
      const regularToken = loginRes.body.data.access_token

      const usersRes = await supertest(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${regularToken}`)
      expect([401, 403]).toContain(usersRes.status)
    })
  })
})
