import { Types, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { SKUModel } from '@database/models/sku.model'
import { ISKU } from '../@types/models.type'
import {
  ISKURepository,
  CreateSKUDTO,
  UpdateSKUDTO,
  BulkDecrementResult,
} from './interfaces/sku.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'
import { BusinessError } from '@services/base.service'

export class SKURepository implements ISKURepository {
  async findById(id: string | Types.ObjectId): Promise<ISKU | null> {
    return SKUModel.findById(id).lean<ISKU | null>()
  }

  async findOne(filter: FilterQuery<ISKU>): Promise<ISKU | null> {
    return SKUModel.findOne(filter).lean<ISKU | null>()
  }

  async find(filter: FilterQuery<ISKU>, options?: QueryOptions): Promise<ISKU[]> {
    return SKUModel.find(filter, null, options).lean<ISKU[]>()
  }

  async findPaginated(filter: FilterQuery<ISKU>, options: PaginationOptions): Promise<PaginatedResult<ISKU>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      SKUModel.find(filter).sort(sort || { createdAt: -1 }).skip(skip).limit(limit).lean<ISKU[]>(),
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

  async findByProductAndValue(productId: string | Types.ObjectId, value: string): Promise<ISKU | null> {
    return SKUModel.findOne({ product: productId, value }).lean<ISKU | null>()
  }

  async findByProductAndVariantValues(productId: string | Types.ObjectId, variantValues: Record<string, string>): Promise<ISKU | null> {
    const filter: FilterQuery<ISKU> = { product: productId }
    for (const [key, val] of Object.entries(variantValues)) {
      filter[`variant_values.${key}`] = val
    }
    return SKUModel.findOne(filter).lean<ISKU | null>()
  }

  async atomicDecrementStock(skuId: string | Types.ObjectId, quantity: number): Promise<ISKU | null> {
    return SKUModel.findOneAndUpdate(
      { _id: skuId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true }
    ).lean<ISKU | null>()
  }

  async atomicIncrementStock(skuId: string | Types.ObjectId, quantity: number): Promise<ISKU | null> {
    return SKUModel.findByIdAndUpdate(
      skuId,
      { $inc: { stock: quantity } },
      { new: true }
    ).lean<ISKU | null>()
  }

  async bulkAtomicDecrementStock(
    items: Array<{ skuId: string | Types.ObjectId; quantity: number }>
  ): Promise<BulkDecrementResult[]> {
    const results: BulkDecrementResult[] = []
    for (const item of items) {
      const sku = await this.atomicDecrementStock(item.skuId, item.quantity)
      results.push({ skuId: item.skuId, success: sku !== null, sku })
      if (!sku) {
        // Rollback all previously successful decrements
        const rollbackErrors: Array<{ skuId: string | Types.ObjectId; error: string }> = []
        for (const prev of results) {
          if (prev.success) {
            try {
              const qty = items.find((i) => i.skuId === prev.skuId)!.quantity
              await this.atomicIncrementStock(prev.skuId, qty)
            } catch (rollbackErr) {
              const errMsg = rollbackErr instanceof Error ? rollbackErr.message : 'Unknown rollback error'
              rollbackErrors.push({ skuId: prev.skuId, error: errMsg })
              console.error(`[SKU Rollback Failed] SKU ${prev.skuId}: ${errMsg}`)
            }
          }
        }
        const errorDetail = rollbackErrors.length > 0
          ? ` (rollback errors: ${rollbackErrors.map(e => `${e.skuId}: ${e.error}`).join(', ')})`
          : ''
        throw new BusinessError(`SKU ${item.skuId} không đủ tồn kho${errorDetail}`)
      }
    }
    return results
  }

  async findLowStock(threshold: number): Promise<ISKU[]> {
    return SKUModel.find({ stock: { $lte: threshold } }).populate('product').lean<ISKU[]>()
  }
}

