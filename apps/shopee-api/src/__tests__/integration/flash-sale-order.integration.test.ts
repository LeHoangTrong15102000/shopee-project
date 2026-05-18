/// <reference types="jest" />

/**
 * Integration Tests: Order with Flash Sale Item (Task 10.7)
 * - soldQuantity is decremented atomically
 * - limitPerUser is enforced
 * - sold out error when stock exhausted
 * - normal purchase succeeds within limits
 */

import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAdminToken, getAuthToken } from '../helpers/auth-helper'
import './setup'

// Mock socket layer (non-critical for this test)
jest.mock('../../socket/utils/flash-sale-emit', () => ({
  emitFlashSaleStockUpdate: jest.fn(),
  startFlashSaleTimer: jest.fn(),
  clearFlashSaleTimer: jest.fn(),
}))

jest.mock('../../socket/socket.init', () => ({
  getIO: jest.fn().mockReturnValue({ emit: jest.fn(), to: jest.fn().mockReturnThis() }),
  getIORequired: jest.fn().mockReturnValue({
    emit: jest.fn(),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  }),
}))

const app = createTestApp()

describe('Order with Flash Sale Item (Task 10.7)', () => {
  let adminToken: string
  let userToken: string
  let userId: string

  const productId = '507f1f77bcf86cd799439011'

  beforeEach(async () => {
    const admin = await getAdminToken(app)
    adminToken = admin.access_token
    const user = await getAuthToken(app)
    userToken = user.access_token
    userId = user.user._id
  })

  const createProduct = async (overrides: Record<string, any> = {}) => {
    const { ProductModel } = await import('@database/models/product.model')
    const { CategoryModel } = await import('@database/models/category.model')

    const category = await CategoryModel.create({ name: `Cat-${Date.now()}` })

    return ProductModel.create({
      _id: productId,
      name: 'Flash Sale Product',
      price: 100000,
      price_before_discount: 120000,
      quantity: 1000,
      sold: 0,
      category: category._id,
      image: 'test.jpg',
      images: ['test.jpg'],
      description: 'Test product',
      ...overrides,
    })
  }

  const createAndActivateFlashSale = async (
    opts: {
      totalQuantity?: number
      limitPerUser?: number
    } = {},
  ) => {
    const { totalQuantity = 100, limitPerUser = 5 } = opts

    const createRes = await supertest(app)
      .post('/admin/flash-sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Order Test Sale',
        startTime: new Date(Date.now() - 3600_000).toISOString(),
        endTime: new Date(Date.now() + 86400_000).toISOString(),
        products: [
          {
            productId,
            originalPrice: 100000,
            flashPrice: 50000,
            totalQuantity,
            limitPerUser,
          },
        ],
      })

    const id = createRes.body.data._id

    await supertest(app)
      .post(`/admin/flash-sales/${id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)

    return id
  }

  const addToCart = async (token: string, count = 1) => {
    await supertest(app)
      .post('/purchases/add-to-cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, buy_count: count })
  }

  const buyProduct = async (token: string, count = 1) => {
    return supertest(app)
      .post('/purchases/buy-products')
      .set('Authorization', `Bearer ${token}`)
      .send([{ product_id: productId, buy_count: count }])
  }

  // ─── Tests ──────────────────────────────────────────────────────────────────

  it('decrements soldQuantity atomically on successful purchase', async () => {
    await createProduct()
    const saleId = await createAndActivateFlashSale({ totalQuantity: 100 })
    await addToCart(userToken, 2)

    const res = await buyProduct(userToken, 2)
    expect(res.status).toBe(200)

    // Verify flash sale soldQuantity was incremented
    const { FlashSaleModel } = await import('@database/models/flash-sale.model')
    const sale = await FlashSaleModel.findById(saleId).lean()
    const product = sale?.products.find((p: any) => p.productId.toString() === productId)
    expect(product?.soldQuantity).toBe(2)
  })

  it('enforces limitPerUser — rejects purchase exceeding limit', async () => {
    await createProduct()
    await createAndActivateFlashSale({ totalQuantity: 100, limitPerUser: 2 })

    // First purchase: buy 2 (at limit)
    await addToCart(userToken, 2)
    const res1 = await buyProduct(userToken, 2)
    expect(res1.status).toBe(200)

    // Second purchase: try to buy 1 more (over limit)
    await addToCart(userToken, 1)
    const res2 = await buyProduct(userToken, 1)

    // Should be rejected with 406 or 422 (BusinessError → UNPROCESSABLE_ENTITY)
    expect([406, 422]).toContain(res2.status)
    expect(res2.body.message).toMatch(/limit/i)
  })

  it('returns sold out error when totalQuantity is exhausted', async () => {
    await createProduct()
    await createAndActivateFlashSale({ totalQuantity: 1, limitPerUser: 5 })

    // First user buys the only item
    await addToCart(userToken, 1)
    const res1 = await buyProduct(userToken, 1)
    expect(res1.status).toBe(200)

    // Second user tries to buy — should be sold out
    const user2 = await getAuthToken(app, { email: `user2-${Date.now()}@test.com` })
    await supertest(app)
      .post('/purchases/add-to-cart')
      .set('Authorization', `Bearer ${user2.access_token}`)
      .send({ product_id: productId, buy_count: 1 })

    const res2 = await supertest(app)
      .post('/purchases/buy-products')
      .set('Authorization', `Bearer ${user2.access_token}`)
      .send([{ product_id: productId, buy_count: 1 }])

    expect([406, 422]).toContain(res2.status)
    expect(res2.body.message).toMatch(/sold out/i)
  })

  it('succeeds when purchase is within limits and stock available', async () => {
    await createProduct()
    await createAndActivateFlashSale({ totalQuantity: 50, limitPerUser: 10 })

    await addToCart(userToken, 3)
    const res = await buyProduct(userToken, 3)

    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
  })
})
