/// <reference types="jest" />
import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('User Profile Integration Tests', () => {
  let authToken: string

  beforeEach(async () => {
    const auth = await getAuthToken(app)
    authToken = `Bearer ${auth.access_token}`
  })

  describe('GET /me', () => {
    it('should return user profile when authenticated', async () => {
      const response = await supertest(app)
        .get('/me')
        .set('Authorization', authToken)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('email')
    })

    it('should return 401 when not authenticated', async () => {
      const response = await supertest(app).get('/me')

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /user', () => {
    it('should update profile name when authenticated', async () => {
      const response = await supertest(app)
        .put('/user')
        .set('Authorization', authToken)
        .send({ name: 'Updated Name' })

      expect(response.status).toBe(200)
      expect(response.body.data.name).toBe('Updated Name')
    })

    it('should return 401 when not authenticated', async () => {
      const response = await supertest(app)
        .put('/user')
        .send({ name: 'Test Name' })

      expect(response.status).toBe(401)
    })
  })
})

