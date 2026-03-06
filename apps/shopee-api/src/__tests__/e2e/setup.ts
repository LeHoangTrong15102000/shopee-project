/// <reference types="jest" />
import { connectTestDB, clearTestDB, disconnectTestDB } from '../helpers/db-setup'
import { CategoryModel } from '@database/models/category.model'
import { UserModel } from '@database/models/user.model'
import { hashValue } from '@utils/crypt'

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
  // Don't clear between tests in E2E - tests build on each other within a describe
})

afterAll(async () => {
  await disconnectTestDB()
})

