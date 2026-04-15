/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Address Integration', () => {
  let authToken: string
  const validAddress = {
    full_name: 'John Doe',
    phone: '0123456789',
    province: 'Ho Chi Minh',
    district: 'District 1',
    ward: 'Ward 1',
    street: '123 Main Street',
  }

  beforeEach(async () => {
    const auth = await getAuthToken(app)
    authToken = auth.access_token
  })

  describe('POST /addresses', () => {
    it('should create address and set first as default', async () => {
      const res = await supertest(app)
        .post('/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress)

      expect(res.status).toBeLessThan(400)
      expect(res.body.data.full_name).toBe(validAddress.full_name)
      expect(res.body.data.is_default).toBe(true)
    })

    it('should fail without auth', async () => {
      const res = await supertest(app).post('/addresses').send(validAddress)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /addresses', () => {
    it('should return empty list initially', async () => {
      const res = await supertest(app).get('/addresses').set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeLessThan(400)
      expect(res.body.data.addresses).toEqual([])
    })

    it('should return all addresses', async () => {
      await supertest(app)
        .post('/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress)
      const res = await supertest(app).get('/addresses').set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeLessThan(400)
      expect(res.body.data.addresses.length).toBe(1)
    })

    it('should fail without auth', async () => {
      const res = await supertest(app).get('/addresses')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /addresses/:id', () => {
    it('should get specific address', async () => {
      const createRes = await supertest(app)
        .post('/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress)
      const addressId = createRes.body.data._id
      const res = await supertest(app)
        .get(`/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeLessThan(400)
      expect(res.body.data._id).toBe(addressId)
    })

    it('should fail with non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app)
        .get(`/addresses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should fail without auth', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app).get(`/addresses/${fakeId}`)
      expect(res.status).toBe(401)
    })
  })

  describe('PUT /addresses/:id', () => {
    it('should update address fields', async () => {
      const createRes = await supertest(app)
        .post('/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress)
      const addressId = createRes.body.data._id
      const res = await supertest(app)
        .put(`/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validAddress, full_name: 'Jane Doe' })
      expect(res.status).toBeLessThan(400)
      expect(res.body.data.full_name).toBe('Jane Doe')
    })

    it('should fail with non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app)
        .put(`/addresses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress)
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should fail without auth', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app).put(`/addresses/${fakeId}`).send(validAddress)
      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /addresses/:id', () => {
    it('should delete non-default address', async () => {
      await supertest(app)
        .post('/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress)
      const second = await supertest(app)
        .post('/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validAddress, full_name: 'Second' })
      const res = await supertest(app)
        .delete(`/addresses/${second.body.data._id}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeLessThan(400)
    })

    it('should fail to delete default when others exist', async () => {
      const first = await supertest(app)
        .post('/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress)
      await supertest(app)
        .post('/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validAddress, full_name: 'Second' })
      const res = await supertest(app)
        .delete(`/addresses/${first.body.data._id}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should fail without auth', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app).delete(`/addresses/${fakeId}`)
      expect(res.status).toBe(401)
    })
  })

  describe('PUT /addresses/:id/default', () => {
    it('should set default address', async () => {
      await supertest(app)
        .post('/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress)
      const second = await supertest(app)
        .post('/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validAddress, full_name: 'Second' })
      const res = await supertest(app)
        .put(`/addresses/${second.body.data._id}/default`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeLessThan(400)
      expect(res.body.data.is_default).toBe(true)
    })

    it('should fail with non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app)
        .put(`/addresses/${fakeId}/default`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })
})
