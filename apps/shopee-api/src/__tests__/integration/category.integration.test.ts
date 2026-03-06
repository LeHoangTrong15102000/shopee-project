/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { CategoryModel } from '@database/models/category.model'
import './setup'

const app = createTestApp()

describe('Category Integration', () => {
  describe('GET /categories', () => {
    it('should return category list (public)', async () => {
      await CategoryModel.create({ name: 'Electronics' })
      await CategoryModel.create({ name: 'Clothing' })

      const res = await supertest(app).get('/categories')
      expect(res.status).toBeLessThan(400)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBe(2)
    })
  })

  describe('GET /categories/:category_id', () => {
    it('should return category detail', async () => {
      const category = await CategoryModel.create({ name: 'Books' })

      const res = await supertest(app).get(`/categories/${category._id}`)
      expect(res.status).toBeLessThan(400)
      expect(res.body.data.name).toBe('Books')
    })

    it('should return error for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app).get(`/categories/${fakeId}`)
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Admin routes - auth required', () => {
    it('POST /admin/categories - requires admin auth', async () => {
      const res = await supertest(app)
        .post('/admin/categories')
        .send({ name: 'New Category' })
      expect(res.status).toBe(401)
    })

    it('POST /admin/categories - regular user gets 403', async () => {
      const auth = await getAuthToken(app)
      const res = await supertest(app)
        .post('/admin/categories')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({ name: 'New Category' })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('PUT /admin/categories/:id - requires admin auth', async () => {
      const category = await CategoryModel.create({ name: 'Original' })
      const res = await supertest(app)
        .put(`/admin/categories/${category._id}`)
        .send({ name: 'Updated' })
      expect(res.status).toBe(401)
    })

    it('DELETE /admin/categories/delete/:id - requires admin auth', async () => {
      const category = await CategoryModel.create({ name: 'ToDelete' })
      const res = await supertest(app)
        .delete(`/admin/categories/delete/${category._id}`)
      expect(res.status).toBe(401)
    })
  })
})

