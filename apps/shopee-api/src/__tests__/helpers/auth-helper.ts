/**
 * Auth Helper for Integration/E2E Tests
 * Provides utilities to get authenticated tokens for testing
 */
import supertest from 'supertest'
import express from 'express'

interface AuthResult {
  access_token: string
  expires: number
  refresh_token: string
  expires_refresh_token: number
  user: {
    _id: string
    email: string
    roles: string[]
    name?: string
  }
}

/**
 * Register a new user and login, returning the auth tokens
 */
export const getAuthToken = async (
  app: express.Application,
  overrides?: { email?: string; password?: string }
): Promise<AuthResult> => {
  const email = overrides?.email || `test-${Date.now()}@test.com`
  const password = overrides?.password || 'Test123456'

  await supertest(app)
    .post('/register')
    .send({ email, password })

  const loginRes = await supertest(app)
    .post('/login')
    .send({ email, password })

  const data = loginRes.body.data
  // Strip 'Bearer ' prefix from access_token if present, so tests can add it themselves
  if (data?.access_token?.startsWith('Bearer ')) {
    data.access_token = data.access_token.replace('Bearer ', '')
  }
  return data
}

/**
 * Get an admin token — creates admin user directly in DB, then logs in
 */
export const getAdminToken = async (app: express.Application): Promise<AuthResult> => {
  const { UserModel } = await import('@database/models/user.model')
  const { hashValue } = await import('@utils/crypt')

  const email = `admin-${Date.now()}@test.com`
  const password = 'Admin123456'
  const hashedPassword = hashValue(password)

  await UserModel.create({
    email,
    password: hashedPassword,
    roles: ['Admin'],
    name: 'Test Admin',
  })

  const loginRes = await supertest(app)
    .post('/login')
    .send({ email, password })

  const data = loginRes.body.data
  // Strip 'Bearer ' prefix from access_token if present, so tests can add it themselves
  if (data?.access_token?.startsWith('Bearer ')) {
    data.access_token = data.access_token.replace('Bearer ', '')
  }
  return data
}

