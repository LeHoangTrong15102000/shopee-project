/**
 * Jest Setup Configuration
 * Cấu hình Jest cho testing api-ecom
 */

/// <reference types="jest" />

// Explicitly set NODE_ENV=test to ensure redis.client.ts returns null
// (Jest sets this by default, but being explicit guards against edge cases)
process.env.NODE_ENV = 'test'

import { Request, Response } from 'express'

// Mock MongoDB connection
jest.mock('@database/database', () => ({
  connectMongoDB: jest.fn(),
}))

// Note: Model mocks are NOT defined here to avoid conflicts with repository tests
// that need their own specific mock implementations.
// Each test file should define its own mocks for models as needed.

// Mock config
jest.mock('@constants/config', () => ({
  config: {
    SECRET_KEY: 'test-secret-key-that-is-at-least-32-chars',
    EXPIRE_ACCESS_TOKEN: 900, // 15 minutes — stateless JWT
    EXPIRE_REFRESH_TOKEN: 2592000, // 30 days
    AUTH_STRICT_MODE: false,
  },
  FOLDER_UPLOAD: 'upload',
  FOLDERS: {
    PRODUCT: 'product',
    AVATAR: 'avatar',
  },
  ROUTE_IMAGE: 'images',
}))

// Interface cho mock request
interface MockRequestOptions {
  body?: Record<string, unknown>
  params?: Record<string, unknown>
  query?: Record<string, unknown>
  headers?: Record<string, string>
  jwtDecoded?: {
    id: string
    email: string
    roles: string[]
    created_at: string
  }
}

/**
 * Tạo mock Request object cho testing
 * @param options - Các options để customize request
 * @returns Mock Request object
 */
export const createMockRequest = (options: MockRequestOptions = {}): Partial<Request> => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    jwtDecoded: options.jwtDecoded,
  } as Partial<Request>
}

/**
 * Tạo mock Response object cho testing
 * @returns Mock Response object với các spy functions
 */
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

/**
 * Tạo mock NextFunction cho middleware testing
 * @returns Mock NextFunction
 */
export const createMockNext = () => jest.fn()

// Cleanup functions
beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.resetAllMocks()
})
