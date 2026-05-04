import { Types, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { ClientSession } from 'mongoose'
import { Logger } from '@utils/logger'
import { SKUModel } from '@database/models/sku.model'
import { ISKU } from '../@types/models.type'
import { IProductRepository } from './interfaces/product.repository.interface'
import {
  ISKURepository,
  CreateSKUDTO,
  UpdateSKUDTO,
  BulkDecrementResult,
} from './interfaces/sku.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'
import { BusinessError } from '@services/base.service'

export class SKURepository implements ISKURepository {
  constructor(private readonly productRepository?: IProductRepository) {}
  async findById(id: string | Types.ObjectId): Promise<ISKU | null> {
    return SKUModel.findById(id).lean<ISKU | null>()
  }

  async findOne(filter: FilterQuery<ISKU>): Promise<ISKU | null> {
    return SKUModel.findOne(filter).lean<ISKU | null>()
  }

  async find(filter: FilterQuery<ISKU>, options?: QueryOptions): Promise<ISKU[]> {
    return SKUModel.find(filter, null, options).lean<ISKU[]>()
  }

  async findPaginated(
    filter: FilterQuery<ISKU>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<ISKU>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      SKUModel.find(filter)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ISKU[]>(),
      SKUModel.countDocuments(filter),
    ])
    return { data, pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total } }
  }

  async create(data: CreateSKUDTO): Promise<ISKU> {
    const sku = await new SKUModel(data).save()
    return sku.toObject() as ISKU
  }

  async updateById(id: string | Types.ObjectId, data: UpdateSKUDTO): Promise<ISKU | null> {
    return SKUModel.findByIdAndUpdate(id, data, { new: true }).lean<ISKU | null>()
  }

  async updateMany(filter: FilterQuery<ISKU>, data: UpdateQuery<ISKU>): Promise<number> {
    const result = await SKUModel.updateMany(filter, data)
    return result.modifiedCount
  }

  async deleteById(id: string | Types.ObjectId): Promise<ISKU | null> {
    return SKUModel.findByIdAndDelete(id).lean<ISKU | null>()
  }

  async deleteMany(filter: FilterQuery<ISKU>): Promise<number> {
    const result = await SKUModel.deleteMany(filter)
    return result.deletedCount
  }

  async count(filter: FilterQuery<ISKU>): Promise<number> {
    return SKUModel.countDocuments(filter)
  }

  async exists(filter: FilterQuery<ISKU>): Promise<boolean> {
    const doc = await SKUModel.exists(filter)
    return doc !== null
  }

  async findByProduct(productId: string | Types.ObjectId): Promise<ISKU[]> {
    return SKUModel.find({ product: productId }).lean<ISKU[]>()
  }

  async findByProductAndValue(
    productId: string | Types.ObjectId,
    value: string,
  ): Promise<ISKU | null> {
    return SKUModel.findOne({ product: productId, value }).lean<ISKU | null>()
  }

  async findByProductAndVariantValues(
    productId: string | Types.ObjectId,
    variantValues: Record<string, string>,
  ): Promise<ISKU | null> {
    const filter: FilterQuery<ISKU> = { product: productId }
    for (const [key, val] of Object.entries(variantValues)) {
      filter[`variant_values.${key}`] = val
    }
    return SKUModel.findOne(filter).lean<ISKU | null>()
  }

  async atomicDecrementStock(
    skuId: string | Types.ObjectId,
    quantity: number,
    options?: { session?: ClientSession },
  ): Promise<ISKU | null> {
    const sessionOpt = options?.session ? { session: options.session } : undefined

    const sku = await SKUModel.findOneAndUpdate(
      { _id: skuId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true, ...sessionOpt },
    ).lean<ISKU | null>()

    if (sku && this.productRepository) {
      // Sync parent Product.quantity
      const productId =
        typeof sku.product === 'object' && '_id' in sku.product
          ? (sku.product as any)._id
          : sku.product
      try {
        await this.productRepository.decrementQuantity(productId, quantity, options)
      } catch (err) {
        // Compensate: restore SKU stock if Product update fails
        await SKUModel.findByIdAndUpdate(skuId, { $inc: { stock: quantity } }, sessionOpt)
        Logger.dbError(
          `[SKU-Product Sync Failed] Product ${productId}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        )
        throw new BusinessError(`Lỗi đồng bộ tồn kho sản phẩm`)
      }
    }

    return sku
  }

  async atomicIncrementStock(
    skuId: string | Types.ObjectId,
    quantity: number,
    options?: { session?: ClientSession },
  ): Promise<ISKU | null> {
    const sessionOpt = options?.session ? { session: options.session } : undefined

    const sku = await SKUModel.findByIdAndUpdate(
      skuId,
      { $inc: { stock: quantity } },
      { new: true, ...sessionOpt },
    ).lean<ISKU | null>()

    if (sku && this.productRepository) {
      // Sync parent Product.quantity
      const productId =
        typeof sku.product === 'object' && '_id' in sku.product
          ? (sku.product as any)._id
          : sku.product
      try {
        await this.productRepository.incrementQuantity(productId, quantity, options)
      } catch (err) {
        // Compensate: restore SKU stock if Product update fails
        await SKUModel.findByIdAndUpdate(skuId, { $inc: { stock: -quantity } }, sessionOpt)
        Logger.dbError(
          `[SKU-Product Sync Failed] Product ${productId}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        )
        throw new BusinessError(`Lỗi đồng bộ tồn kho sản phẩm`)
      }
    }

    return sku
  }

  async bulkAtomicDecrementStock(
    items: Array<{ skuId: string | Types.ObjectId; quantity: number }>,
    options?: { session?: ClientSession },
  ): Promise<BulkDecrementResult[]> {
    const results: BulkDecrementResult[] = []
    const insideTransaction = !!options?.session

    // Manual compensating rollback — only used when NOT inside a Mongoose transaction.
    // When a session is active, Mongoose aborts the whole transaction on error, so
    // calling atomicIncrementStock without the session would double-apply the increment.
    const rollbackSuccessful = async () => {
      if (insideTransaction) {
        // Let the Mongoose transaction handle rollback — do not manually compensate.
        return []
      }
      const rollbackErrors: Array<{ skuId: string | Types.ObjectId; error: string }> = []
      for (const prev of results) {
        if (prev.success) {
          try {
            const qty = items.find((i) => i.skuId === prev.skuId)!.quantity
            await this.atomicIncrementStock(prev.skuId, qty)
          } catch (rollbackErr) {
            const errMsg =
              rollbackErr instanceof Error ? rollbackErr.message : 'Unknown rollback error'
            rollbackErrors.push({ skuId: prev.skuId, error: errMsg })
            Logger.dbError(`[SKU Rollback Failed] SKU ${prev.skuId}: ${errMsg}`)
          }
        }
      }
      return rollbackErrors
    }

    for (const item of items) {
      try {
        const sku = await this.atomicDecrementStock(item.skuId, item.quantity, options)
        results.push({ skuId: item.skuId, success: sku !== null, sku })
        if (!sku) {
          // Insufficient stock — rollback all previously successful decrements
          const rollbackErrors = await rollbackSuccessful()
          const errorDetail =
            rollbackErrors.length > 0
              ? ` (rollback errors: ${rollbackErrors.map((e) => `${e.skuId}: ${e.error}`).join(', ')})`
              : ''
          throw new BusinessError(`SKU ${item.skuId} không đủ tồn kho${errorDetail}`)
        }
      } catch (err) {
        if (err instanceof BusinessError) {
          // Re-throw BusinessErrors (insufficient stock or Product sync failure)
          // If it's from atomicDecrementStock's Product sync failure, SKU was already compensated
          if (results.length > 0 && results[results.length - 1]?.success !== false) {
            // Product sync failure — mark this item as failed, rollback previous successes
            results.push({ skuId: item.skuId, success: false, sku: null })
            await rollbackSuccessful()
          }
          throw err
        }
        throw err
      }
    }
    return results
  }

  async findLowStock(threshold: number): Promise<ISKU[]> {
    return SKUModel.find({ stock: { $lte: threshold } })
      .populate('product')
      .lean<ISKU[]>()
  }
}
