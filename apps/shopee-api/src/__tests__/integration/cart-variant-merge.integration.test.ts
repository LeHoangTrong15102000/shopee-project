/// <reference types="jest" />
/**
 * Cart variant-switch merge integration test — Tasks 6.1 + 6.2
 *
 * Verifies the backend end-to-end merge: when a variant switch is requested
 * and the target SKU already has an in-cart line, the server must:
 *   - sum the two buy_counts into the target line
 *   - delete the source line
 *   - persist exactly one in-cart line for (user, product, target SKU)
 *
 * Uses a real in-memory MongoDB instance (via the shared integration setup.ts).
 * No production logic is changed; this test is detection-only.
 */
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import { SKUModel } from '@database/models/sku.model'
import { PurchaseModel } from '@database/models/purchase.model'
import './setup'

const app = createTestApp()

describe('Cart variant-switch — backend merge integration (Tasks 6.1 + 6.2)', () => {
  let authToken: string
  let userId: string
  let productId: string
  let sourceSkuId: string
  let targetSkuId: string

  // Task 6.1 — seed a cart with two in-cart lines for the same product
  beforeEach(async () => {
    const category = await CategoryModel.create({ name: 'Test Category' })

    const product = await ProductModel.create({
      name: 'Variant Merge Test Product',
      price: 100000,
      price_before_discount: 120000,
      quantity: 50,
      sold: 0,
      view: 0,
      image: 'test.jpg',
      images: ['test.jpg'],
      category: category._id,
      description: 'Product for variant merge integration test',
      rating: 4.5,
    })
    productId = product._id.toString()

    // Source SKU (Red) — buy_count Ns = 2
    const sourceSku = await SKUModel.create({
      value: 'Red',
      price: 100000,
      stock: 20,
      product: product._id,
      variant_values: { color: 'Red' },
    })
    sourceSkuId = sourceSku._id.toString()

    // Target SKU (Blue) — buy_count Nt = 3
    const targetSku = await SKUModel.create({
      value: 'Blue',
      price: 150000,
      stock: 20,
      product: product._id,
      variant_values: { color: 'Blue' },
    })
    targetSkuId = targetSku._id.toString()

    const auth = await getAuthToken(app)
    authToken = auth.access_token
    userId = auth.user._id

    // Seed two in-cart lines directly (status -1 = IN_CART)
    await PurchaseModel.create({
      user: new mongoose.Types.ObjectId(userId),
      product: product._id,
      sku: sourceSku._id,
      buy_count: 2, // Ns
      price: 100000,
      price_before_discount: 120000,
      status: -1,
    })

    await PurchaseModel.create({
      user: new mongoose.Types.ObjectId(userId),
      product: product._id,
      sku: targetSku._id,
      buy_count: 3, // Nt
      price: 150000,
      price_before_discount: 150000,
      status: -1,
    })
  })

  // Task 6.2 — invoke the switch and assert the DB ends with one merged line
  it('should merge two in-cart lines into one when switching to an already-in-cart target SKU', async () => {
    // Invoke the variant switch: source SKU → target SKU
    const res = await supertest(app)
      .put('/purchases/update-purchase')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        product_id: productId,
        buy_count: 2, // Ns (source line buy_count)
        sku_id: sourceSkuId,
        target_sku_id: targetSkuId,
      })

    expect(res.status).toBeLessThan(400)

    // Assert exactly one in-cart line remains for (user, product, target SKU)
    const targetLines = await PurchaseModel.find({
      user: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(productId),
      sku: new mongoose.Types.ObjectId(targetSkuId),
      status: -1,
    }).lean()

    expect(targetLines).toHaveLength(1)
    // buy_count must equal Ns (2) + Nt (3) = 5
    expect(targetLines[0].buy_count).toBe(5)

    // Assert no in-cart line remains for the source SKU
    const sourceLines = await PurchaseModel.find({
      user: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(productId),
      sku: new mongoose.Types.ObjectId(sourceSkuId),
      status: -1,
    }).lean()

    expect(sourceLines).toHaveLength(0)
  })
})
