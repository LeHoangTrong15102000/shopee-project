import { Types, ClientSession } from 'mongoose'
import { IFlashSale, IFlashSaleProduct, FlashSaleStatus } from '../@types/models.type'
import { IFlashSaleRepository } from '@repositories/interfaces/flash-sale.repository.interface'
import {
  BaseService,
  NotFoundError,
  ValidationError,
  BusinessError,
  ConflictError,
} from './base.service'
import { PaginatedResult } from '@repositories/interfaces/base.repository.interface'
import { PurchaseModel } from '@database/models/purchase.model'
import { STATUS_PURCHASE } from '@constants/purchase'

export class FlashSaleService extends BaseService {
  constructor(private readonly flashSaleRepository: IFlashSaleRepository) {
    super()
  }

  /**
   * Create a new flash sale.
   * Validates products exist and checks for overlapping flash sales for the same products.
   */
  async create(data: {
    name: string
    description?: string
    startTime: string | Date
    endTime: string | Date
    status?: FlashSaleStatus
    products: Array<{
      productId: string
      skuId?: string
      originalPrice: number
      flashPrice: number
      totalQuantity: number
      limitPerUser: number
    }>
    createdBy: string | Types.ObjectId
  }): Promise<IFlashSale> {
    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)

    if (endTime <= startTime) {
      throw new ValidationError('endTime must be after startTime')
    }

    const productIds = data.products.map((p) => p.productId)
    await this._checkProductOverlap(productIds, startTime, endTime)

    const products: Partial<IFlashSaleProduct>[] = data.products.map((p) => ({
      productId: new Types.ObjectId(p.productId),
      skuId: p.skuId ? new Types.ObjectId(p.skuId) : undefined,
      originalPrice: p.originalPrice,
      flashPrice: p.flashPrice,
      totalQuantity: p.totalQuantity,
      soldQuantity: 0,
      limitPerUser: p.limitPerUser,
    }))

    return this.flashSaleRepository.create({
      name: data.name,
      description: data.description,
      startTime,
      endTime,
      status: data.status || 'DRAFT',
      products: products as IFlashSaleProduct[],
      createdBy: new Types.ObjectId(data.createdBy.toString()),
    })
  }

  /**
   * Update a flash sale. Only allowed if status is DRAFT or SCHEDULED.
   */
  async update(
    id: string,
    data: {
      name?: string
      description?: string
      startTime?: string | Date
      endTime?: string | Date
      products?: Array<{
        productId: string
        skuId?: string
        originalPrice: number
        flashPrice: number
        totalQuantity: number
        limitPerUser: number
      }>
    },
  ): Promise<IFlashSale> {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid flash sale ID')

    const existing = await this.flashSaleRepository.findById(id)
    if (!existing) throw new NotFoundError('Flash sale', id)

    if (existing.status !== 'DRAFT' && existing.status !== 'SCHEDULED') {
      throw new BusinessError(
        `Cannot update flash sale with status '${existing.status}'. Only DRAFT or SCHEDULED flash sales can be edited.`,
      )
    }

    const updateData: Partial<IFlashSale> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description

    const startTime = data.startTime ? new Date(data.startTime) : existing.startTime
    const endTime = data.endTime ? new Date(data.endTime) : existing.endTime

    if (data.startTime) updateData.startTime = startTime
    if (data.endTime) updateData.endTime = endTime

    if (endTime <= startTime) {
      throw new ValidationError('endTime must be after startTime')
    }

    if (data.products) {
      const productIds = data.products.map((p) => p.productId)
      await this._checkProductOverlap(productIds, startTime, endTime, id)

      updateData.products = data.products.map((p) => ({
        productId: new Types.ObjectId(p.productId),
        skuId: p.skuId ? new Types.ObjectId(p.skuId) : undefined,
        originalPrice: p.originalPrice,
        flashPrice: p.flashPrice,
        totalQuantity: p.totalQuantity,
        soldQuantity: 0,
        limitPerUser: p.limitPerUser,
      })) as IFlashSaleProduct[]
    }

    const updated = await this.flashSaleRepository.updateById(id, updateData)
    if (!updated) throw new NotFoundError('Flash sale', id)
    return updated
  }

  /**
   * Delete a flash sale.
   * Hard delete if DRAFT, soft delete (CANCELLED) otherwise.
   */
  async delete(id: string): Promise<{ deleted: boolean; cancelled: boolean }> {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid flash sale ID')

    const existing = await this.flashSaleRepository.findById(id)
    if (!existing) throw new NotFoundError('Flash sale', id)

    if (existing.status === 'DRAFT') {
      await this.flashSaleRepository.deleteById(id)
      return { deleted: true, cancelled: false }
    }

    const updated = await this.flashSaleRepository.updateById(id, { status: 'CANCELLED' })
    if (!updated) throw new NotFoundError('Flash sale', id)
    return { deleted: false, cancelled: true }
  }

  /**
   * Manually activate a flash sale (change status to ACTIVE).
   */
  async activate(id: string): Promise<IFlashSale> {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid flash sale ID')

    const existing = await this.flashSaleRepository.findById(id)
    if (!existing) throw new NotFoundError('Flash sale', id)

    if (existing.status !== 'DRAFT' && existing.status !== 'SCHEDULED') {
      throw new BusinessError(
        `Cannot activate flash sale with status '${existing.status}'. Only DRAFT or SCHEDULED flash sales can be activated.`,
      )
    }

    const updated = await this.flashSaleRepository.updateById(id, { status: 'ACTIVE' })
    if (!updated) throw new NotFoundError('Flash sale', id)
    return updated
  }

  /**
   * Manually deactivate a flash sale (change status to ENDED).
   */
  async deactivate(id: string): Promise<IFlashSale> {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid flash sale ID')

    const existing = await this.flashSaleRepository.findById(id)
    if (!existing) throw new NotFoundError('Flash sale', id)

    if (existing.status !== 'ACTIVE') {
      throw new BusinessError(
        `Cannot deactivate flash sale with status '${existing.status}'. Only ACTIVE flash sales can be deactivated.`,
      )
    }

    const updated = await this.flashSaleRepository.updateById(id, { status: 'ENDED' })
    if (!updated) throw new NotFoundError('Flash sale', id)
    return updated
  }

  /**
   * Get all currently ACTIVE flash sales with product details.
   */
  async getActive(): Promise<IFlashSale[]> {
    return this.flashSaleRepository.findActive()
  }

  /**
   * Get a flash sale by ID with product details.
   */
  async getById(id: string): Promise<IFlashSale> {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid flash sale ID')

    const flashSale = await this.flashSaleRepository.findById(id)
    if (!flashSale) throw new NotFoundError('Flash sale', id)
    return flashSale
  }

  /**
   * Get paginated list of flash sales with optional status filter.
   */
  async list(options: {
    page: number
    limit: number
    status?: FlashSaleStatus
  }): Promise<PaginatedResult<IFlashSale>> {
    const filter: Record<string, unknown> = {}
    if (options.status) filter.status = options.status

    return this.flashSaleRepository.findPaginated(filter, {
      page: options.page,
      limit: options.limit,
      sort: { createdAt: -1 },
    })
  }

  /**
   * Get stats for a flash sale: total sold, revenue, remaining quantity per product.
   */
  async getStats(id: string): Promise<{
    totalSold: number
    totalRevenue: number
    remainingQuantity: number
    products: Array<{
      productId: string
      flashPrice: number
      originalPrice: number
      totalQuantity: number
      soldQuantity: number
      remainingQuantity: number
    }>
  }> {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid flash sale ID')

    const flashSale = await this.flashSaleRepository.findById(id)
    if (!flashSale) throw new NotFoundError('Flash sale', id)

    let totalSold = 0
    let totalRevenue = 0
    let remainingQuantity = 0

    const products = flashSale.products.map((p) => {
      const remaining = p.totalQuantity - p.soldQuantity
      totalSold += p.soldQuantity
      totalRevenue += p.soldQuantity * p.flashPrice
      remainingQuantity += remaining
      return {
        productId: p.productId.toString(),
        flashPrice: p.flashPrice,
        originalPrice: p.originalPrice,
        totalQuantity: p.totalQuantity,
        soldQuantity: p.soldQuantity,
        remainingQuantity: remaining,
      }
    })

    return { totalSold, totalRevenue, remainingQuantity, products }
  }

  /**
   * Purchase a flash sale item atomically.
   * Checks limitPerUser, validates stock, and decrements soldQuantity.
   * Accepts optional ClientSession for transaction support.
   */
  async purchaseFlashSaleItem(
    flashSaleId: string,
    productId: string,
    userId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<IFlashSale> {
    if (!this.isValidObjectId(flashSaleId)) throw new ValidationError('Invalid flash sale ID')
    if (!this.isValidObjectId(productId)) throw new ValidationError('Invalid product ID')
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID')

    const flashSale = await this.flashSaleRepository.findById(flashSaleId)
    if (!flashSale) throw new NotFoundError('Flash sale', flashSaleId)

    if (flashSale.status !== 'ACTIVE') {
      throw new BusinessError('Flash sale is not active')
    }

    const now = new Date()
    if (now < flashSale.startTime || now > flashSale.endTime) {
      throw new BusinessError('Flash sale is not currently running')
    }

    const product = flashSale.products.find((p) => p.productId.toString() === productId)
    if (!product) {
      throw new NotFoundError('Product in flash sale', productId)
    }

    // Check stock
    if (product.soldQuantity + quantity > product.totalQuantity) {
      throw new BusinessError('Flash sale item is sold out')
    }

    // Check limitPerUser — count user's previous purchases of this product in this flash sale
    const userPurchaseCount = await PurchaseModel.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          product: new Types.ObjectId(productId),
          status: { $ne: STATUS_PURCHASE.IN_CART },
          // Only count purchases made during this flash sale's time window
          createdAt: { $gte: flashSale.startTime },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$buy_count' },
        },
      },
    ])

    const alreadyPurchased = userPurchaseCount[0]?.total || 0
    if (alreadyPurchased + quantity > product.limitPerUser) {
      throw new BusinessError(
        `Purchase limit exceeded. You can only buy ${product.limitPerUser} of this item per flash sale.`,
      )
    }

    // Atomic decrement
    const updated = await this.flashSaleRepository.atomicDecrementSold(
      flashSaleId,
      productId,
      quantity,
      session,
    )

    if (!updated) {
      throw new BusinessError('Flash sale item is sold out')
    }

    return updated
  }

  // ─── Private Helpers ─────────────────────────────────────────────

  /**
   * Check for overlapping flash sales for the given product IDs and time range.
   * Throws ConflictError if overlap found.
   * @param excludeId - Flash sale ID to exclude from check (for updates)
   */
  private async _checkProductOverlap(
    productIds: string[],
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<void> {
    for (const productId of productIds) {
      if (!this.isValidObjectId(productId)) {
        throw new ValidationError(`Invalid productId: ${productId}`)
      }

      const existing = await this.flashSaleRepository.findByProductId(productId)

      for (const sale of existing) {
        if (excludeId && sale._id?.toString() === excludeId) continue
        if (sale.status !== 'SCHEDULED' && sale.status !== 'ACTIVE') continue

        // Check time overlap: !(newEnd <= existingStart || newStart >= existingEnd)
        const overlaps = !(endTime <= sale.startTime || startTime >= sale.endTime)
        if (overlaps) {
          throw new ConflictError(
            `Product ${productId} already has a flash sale (id: ${sale._id}, name: "${sale.name}") scheduled during this time range`,
          )
        }
      }
    }
  }
}
