/// <reference types="jest" />
import { connectTestDB, clearTestDB, disconnectTestDB } from '../helpers/db-setup'
import { resetAllRateLimits } from '@middleware/rateLimiter.middleware'
import { resetAllLoginAttempts } from '@middleware/security.middleware'

// Hard mock for resend — prevents any real HTTP calls to the Resend API
// (Resend quota is exhausted; this ensures no integration test hits the live service)
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'mock' }, error: null }),
    },
  })),
}))

// Set global timeout for integration tests (Jest 29.x ignores testTimeout at project level)
jest.setTimeout(30000)

beforeAll(async () => {
  await connectTestDB()
}, 120000)

beforeEach(async () => {
  await clearTestDB()
  resetAllRateLimits()
  resetAllLoginAttempts()
})

afterAll(async () => {
  await disconnectTestDB()
}, 30000)
