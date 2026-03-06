/// <reference types="jest" />
import { connectTestDB, clearTestDB, disconnectTestDB } from '../helpers/db-setup'

// Set global timeout for integration tests (Jest 29.x ignores testTimeout at project level)
jest.setTimeout(30000)

beforeAll(async () => {
  await connectTestDB()
}, 120000)

beforeEach(async () => {
  await clearTestDB()
})

afterAll(async () => {
  await disconnectTestDB()
}, 30000)

