/// <reference types="jest" />
import { connectTestDB, clearTestDB, disconnectTestDB } from '../helpers/db-setup'
import { CategoryModel } from '@database/models/category.model'
import { UserModel } from '@database/models/user.model'
import { hashValue } from '@utils/crypt'
import { resetAllRateLimits } from '@middleware/rateLimiter.middleware'
import { resetAllLoginAttempts } from '@middleware/security.middleware'

beforeAll(async () => {
  await connectTestDB()
  // Seed initial data
  await CategoryModel.create({ name: 'Electronics' })
  await CategoryModel.create({ name: 'Clothing' })
  // Create admin user
  await UserModel.create({
    email: 'admin@shopee.com',
    password: hashValue('Admin123456'),
    roles: ['Admin'],
    name: 'Admin User',
  })
}, 30000)

afterEach(async () => {
  // Reset rate limits and login attempts between tests to prevent cross-test interference
  resetAllRateLimits()
  resetAllLoginAttempts()
})

afterAll(async () => {
  await disconnectTestDB()
})
