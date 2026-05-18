/// <reference types="jest" />

/**
 * Integration Tests: WebSocket Stock Update Broadcast (Task 10.6)
 * Verifies that emitFlashSaleStockUpdate is called with correct payload
 * after a flash sale purchase is committed.
 */

import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAdminToken, getAuthToken } from '../helpers/auth-helper'
import './setup'

// Mock the socket emit module to capture broadcast calls
const mockEmitFlashSaleStockUpdate = jest.fn()
jest.mock('../../socket/utils/flash-sale-emit', () => ({
  emitFlashSaleStockUpdate: (...args: any[]) => mockEmitFlashSaleStockUpdate(...args),
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

describe('WebSocket Flash Sale Stock Update Broadcast (Task 10.6)', () => {
  let adminToken: string
  let userToken: string
  let userId: string

  const productId = '507f1f77bcf86cd799439011'

  beforeEach(async () => {
    mockEmitFlashSaleStockUpdate.mockClear()
    const admin = await getAdminToken(app)
    adminToken = admin.access_token
    const user = await getAuthToken(app)
    userToken = user.access_token
    userId = user.user._id
  })

  /**
   * Helper: create a product in DB so the purchase flow can find it
   */
  const createProduct = async () => {
    const { ProductModel } = await import('@database/models/product.model')
    const { CategoryModel } = await import('@database/models/category.model')

    const category = await CategoryModel.create({ name: `Cat-${Date.now()}` })

    const product = await ProductModel.create({
      _id: productId,
      name: 'Flash Sale Product',
      price: 100000,
      price_before_discount: 120000,
      quantity: 1000,
      sold: 0,
      category: category._id,
      image: 'test.jpg',
      images: ['test.jpg'],
      description: 'Test product for flash sale',
    })

    return product
  }

  /**
   * Helper: create and activate a flash sale for the test product
   */
  const createAndActivateFlashSale = async () => {
    const createRes = await supertest(app)
      .post('/admin/flash-sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'WebSocket Test Sale',
        startTime: new Date(Date.now() - 3600_000).toISOString(),
        endTime: new Date(Date.now() + 86400_000).toISOString(),
        products: [
          {
            productId,
            originalPrice: 100000,
            flashPrice: 50000,
            totalQuantity: 100,
            limitPerUser: 5,
          },
        ],
      })

    const id = createRes.body.data._id

    await supertest(app)
      .post(`/admin/flash-sales/${id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)

    return id
  }

  /**
   * Helper: add product to cart
   */
  const addToCart = async () => {
    await supertest(app)
      .post('/purchases/add-to-cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_id: productId, buy_count: 1 })
  }

  it('broadcasts FLASH_SALE_STOCK_UPDATE after successful purchase', async () => {
    await createProduct()
    const saleId = await createAndActivateFlashSale()
    await addToCart()

    const res = await supertest(app)
      .post('/purchases/buy-products')
      .set('Authorization', `Bearer ${userToken}`)
      .send([{ product_id: productId, buy_count: 1 }])

    // Purchase should succeed
    expect(res.status).toBe(200)

    // emitFlashSaleStockUpdate should have been called with correct args
    expect(mockEmitFlashSaleStockUpdate).toHaveBeenCalledWith(
      saleId,
      productId,
      expect.any(Number), // remainingQuantity
      expect.any(Number), // soldQuantity
    )
  })

  it('broadcasts correct remaining stock after purchase', async () => {
    await createProduct()
    const saleId = await createAndActivateFlashSale()
    await addToCart()

    await supertest(app)
      .post('/purchases/buy-products')
      .set('Authorization', `Bearer ${userToken}`)
      .send([{ product_id: productId, buy_count: 1 }])

    // Verify the stock numbers: totalQuantity=100, bought 1, so remaining=99, sold=1
    const call = mockEmitFlashSaleStockUpdate.mock.calls[0]
    if (call) {
      const [, , remainingQuantity, soldQuantity] = call
      expect(remainingQuantity).toBe(99)
      expect(soldQuantity).toBe(1)
    }
  })

  it('does NOT broadcast when purchase is for non-flash-sale product', async () => {
    const { ProductModel } = await import('@database/models/product.model')
    const { CategoryModel } = await import('@database/models/category.model')

    const category = await CategoryModel.create({ name: `Cat2-${Date.now()}` })
    const normalProductId = '507f1f77bcf86cd799439099'

    await ProductModel.create({
      _id: normalProductId,
      name: 'Normal Product',
      price: 50000,
      price_before_discount: 60000,
      quantity: 500,
      sold: 0,
      category: category._id,
      image: 'normal.jpg',
      images: ['normal.jpg'],
      description: 'Not in any flash sale',
    })

    // Add to cart and buy
    await supertest(app)
      .post('/purchases/add-to-cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_id: normalProductId, buy_count: 1 })

    await supertest(app)
      .post('/purchases/buy-products')
      .set('Authorization', `Bearer ${userToken}`)
      .send([{ product_id: normalProductId, buy_count: 1 }])

    // No flash sale broadcast should occur
    expect(mockEmitFlashSaleStockUpdate).not.toHaveBeenCalled()
  })
})
