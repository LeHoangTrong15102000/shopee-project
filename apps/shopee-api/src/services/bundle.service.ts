/**
 * BundleService — manages bundle deals and discount calculation.
 *
 * Provides CRUD for bundles, finds applicable bundles for a cart,
 * and calculates the best bundle discount.
 */
import mongoose from 'mongoose'
import { BundleModel, IBundle, BundleDiscountType } from '@database/models/bundle.model'
import { BaseService, NotFoundError, ValidationError, BusinessError } from './base.service'
import { Logger } from '@utils/logger'

export interface CreateBundleDTO {
  name: string
  description?: string
  productIds: string[]
  discountType: BundleDiscountType
  discountValue: number
  minQuantity?: number
  isActive?: boolean
  startDate?: Date
  endDate?: Date
  maxRedemptions?: number
}

export type UpdateBundleDTO = Partial<CreateBundleDTO>

export interface CartItem {
  productId: string
  quantity: number
  price: number
}

export interface BundleDiscountResult {
  bundle: IBundle
  discountAmount: number
  discountedTotal: number
}

export class BundleService extends BaseService {
  /**
   * Create a new bundle.
   */
  async createBundle(dto: CreateBundleDTO): Promise<IBundle> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ValidationError('Bundle name is required')
    }
    if (!dto.productIds || dto.productIds.length < 2) {
      throw new ValidationError('A bundle must contain at least 2 products')
    }
    if (dto.discountValue < 0) {
      throw new ValidationError('Discount value must be non-negative')
    }
    if (dto.discountType === 'percentage' && dto.discountValue > 100) {
      throw new ValidationError('Percentage discount cannot exceed 100')
    }
    if (dto.startDate && dto.endDate && dto.startDate >= dto.endDate) {
      throw new ValidationError('startDate must be before endDate')
    }

    const bundle = await BundleModel.create({
      name: dto.name.trim(),
      description: dto.description,
      productIds: dto.productIds.map((id) => new mongoose.Types.ObjectId(id)),
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minQuantity: dto.minQuantity ?? 1,
      isActive: dto.isActive ?? true,
      startDate: dto.startDate,
      endDate: dto.endDate,
      maxRedemptions: dto.maxRedemptions,
      currentRedemptions: 0,
    })

    Logger.apiInfo('[BundleService] Bundle created', { bundleId: bundle._id, name: bundle.name })
    return bundle.toObject() as IBundle
  }

  /**
   * Update an existing bundle.
   */
  async updateBundle(bundleId: string, dto: UpdateBundleDTO): Promise<IBundle> {
    if (!this.isValidObjectId(bundleId)) {
      throw new ValidationError('Invalid bundle ID format')
    }

    const update: Record<string, unknown> = {}
    if (dto.name !== undefined) update.name = dto.name.trim()
    if (dto.description !== undefined) update.description = dto.description
    if (dto.productIds !== undefined) {
      if (dto.productIds.length < 2)
        throw new ValidationError('A bundle must contain at least 2 products')
      update.productIds = dto.productIds.map((id) => new mongoose.Types.ObjectId(id))
    }
    if (dto.discountType !== undefined) update.discountType = dto.discountType
    if (dto.discountValue !== undefined) {
      if (dto.discountValue < 0) throw new ValidationError('Discount value must be non-negative')
      update.discountValue = dto.discountValue
    }
    if (dto.minQuantity !== undefined) update.minQuantity = dto.minQuantity
    if (dto.isActive !== undefined) update.isActive = dto.isActive
    if (dto.startDate !== undefined) update.startDate = dto.startDate
    if (dto.endDate !== undefined) update.endDate = dto.endDate
    if (dto.maxRedemptions !== undefined) update.maxRedemptions = dto.maxRedemptions

    const bundle = await BundleModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(bundleId),
      { $set: update },
      { new: true },
    ).lean()

    if (!bundle) throw new NotFoundError('Bundle', bundleId)

    return bundle as IBundle
  }

  /**
   * Soft-delete a bundle by setting isActive = false.
   */
  async deleteBundle(bundleId: string): Promise<void> {
    if (!this.isValidObjectId(bundleId)) {
      throw new ValidationError('Invalid bundle ID format')
    }

    const result = await BundleModel.findByIdAndUpdate(new mongoose.Types.ObjectId(bundleId), {
      $set: { isActive: false },
    }).lean()

    if (!result) throw new NotFoundError('Bundle', bundleId)

    Logger.apiInfo('[BundleService] Bundle deactivated', { bundleId })
  }

  /**
   * Get all active, non-expired bundles.
   */
  async getActiveBundles(): Promise<IBundle[]> {
    const now = new Date()
    return BundleModel.find({
      isActive: true,
      $or: [{ endDate: null }, { endDate: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .lean() as Promise<IBundle[]>
  }

  /**
   * Get a single bundle by ID.
   */
  async getBundleById(bundleId: string): Promise<IBundle> {
    if (!this.isValidObjectId(bundleId)) {
      throw new ValidationError('Invalid bundle ID format')
    }

    const bundle = await BundleModel.findById(new mongoose.Types.ObjectId(bundleId)).lean()
    if (!bundle) throw new NotFoundError('Bundle', bundleId)

    return bundle as IBundle
  }

  /**
   * Find active bundles that contain a specific product.
   */
  async findApplicableBundles(productId: string): Promise<IBundle[]> {
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }

    const now = new Date()
    return BundleModel.find({
      isActive: true,
      productIds: new mongoose.Types.ObjectId(productId),
      $or: [{ endDate: null }, { endDate: { $gt: now } }],
    }).lean() as Promise<IBundle[]>
  }

  /**
   * Calculate the best bundle discount for a given cart.
   * Returns the bundle with the highest discount amount, or null if none apply.
   */
  calculateBundleDiscount(bundles: IBundle[], cartItems: CartItem[]): BundleDiscountResult | null {
    const cartProductIds = new Set(cartItems.map((item) => item.productId))
    const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    let best: BundleDiscountResult | null = null

    for (const bundle of bundles) {
      // Check if all bundle products are in the cart
      const allPresent = bundle.productIds.every((pid) => cartProductIds.has(pid.toString()))
      if (!allPresent) continue

      // Check min quantity
      const bundleItems = cartItems.filter((item) =>
        bundle.productIds.some((pid) => pid.toString() === item.productId),
      )
      const totalQty = bundleItems.reduce((sum, item) => sum + item.quantity, 0)
      if (totalQty < bundle.minQuantity) continue

      // Check max redemptions
      if (
        bundle.maxRedemptions !== undefined &&
        bundle.currentRedemptions >= bundle.maxRedemptions
      ) {
        continue
      }

      // Calculate discount amount
      const bundleSubtotal = bundleItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

      let discountAmount = 0
      if (bundle.discountType === 'percentage') {
        discountAmount = (bundleSubtotal * bundle.discountValue) / 100
      } else if (bundle.discountType === 'fixed') {
        discountAmount = Math.min(bundle.discountValue, bundleSubtotal)
      } else if (bundle.discountType === 'buy_x_get_y') {
        // buy_x_get_y: discountValue is the number of free items (cheapest)
        const sortedPrices = bundleItems
          .flatMap((item) => Array(item.quantity).fill(item.price))
          .sort((a, b) => a - b)
        const freeCount = Math.min(Math.floor(bundle.discountValue), sortedPrices.length)
        discountAmount = sortedPrices.slice(0, freeCount).reduce((s, p) => s + p, 0)
      }

      if (!best || discountAmount > best.discountAmount) {
        best = {
          bundle,
          discountAmount,
          discountedTotal: Math.max(0, cartTotal - discountAmount),
        }
      }
    }

    return best
  }
}
