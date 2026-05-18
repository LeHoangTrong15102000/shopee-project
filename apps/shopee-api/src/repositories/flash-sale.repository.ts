import { Types, ClientSession, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { FlashSaleModel } from '@database/models/flash-sale.model'
import { IFlashSale } from '../@types/models.type'
import { IFlashSaleRepository } from './interfaces/flash-sale.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class FlashSaleRepository implements IFlashSaleRepository {
  async findById(id: string | Types.ObjectId): Promise<IFlashSale | null> {
    return FlashSaleModel.findById(id).lean<IFlashSale | null>()
  }

  async findOne(filter: FilterQuery<IFlashSale>): Promise<IFlashSale | null> {
    return FlashSaleModel.findOne(filter).lean<IFlashSale | null>()
  }

  async find(filter: FilterQuery<IFlashSale>, options?: QueryOptions): Promise<IFlashSale[]> {
    return FlashSaleModel.find(filter, null, options).lean<IFlashSale[]>()
  }

  async findPaginated(
    filter: FilterQuery<IFlashSale>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<IFlashSale>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      FlashSaleModel.find(filter)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IFlashSale[]>(),
      FlashSaleModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        page_size: Math.ceil(total / limit) || 1,
        total,
      },
    }
  }

  async create(data: Partial<IFlashSale>): Promise<IFlashSale> {
    const doc = await FlashSaleModel.create(data)
    return FlashSaleModel.findById(doc._id).lean<IFlashSale>() as Promise<IFlashSale>
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<IFlashSale>,
  ): Promise<IFlashSale | null> {
    return FlashSaleModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    ).lean<IFlashSale | null>()
  }

  async updateMany(
    filter: FilterQuery<IFlashSale>,
    data: UpdateQuery<IFlashSale>,
  ): Promise<number> {
    const result = await FlashSaleModel.updateMany(filter, data)
    return result.modifiedCount
  }

  async deleteById(id: string | Types.ObjectId): Promise<IFlashSale | null> {
    return FlashSaleModel.findByIdAndDelete(id).lean<IFlashSale | null>()
  }

  async deleteMany(filter: FilterQuery<IFlashSale>): Promise<number> {
    const result = await FlashSaleModel.deleteMany(filter)
    return result.deletedCount
  }

  async count(filter: FilterQuery<IFlashSale>): Promise<number> {
    return FlashSaleModel.countDocuments(filter)
  }

  async exists(filter: FilterQuery<IFlashSale>): Promise<boolean> {
    const doc = await FlashSaleModel.exists(filter)
    return doc !== null
  }

  // ─── Flash Sale Specific Methods ─────────────────────────────────

  async findActive(): Promise<IFlashSale[]> {
    const now = new Date()
    return FlashSaleModel.find({
      status: 'ACTIVE',
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).lean<IFlashSale[]>()
  }

  async findByProductId(productId: string | Types.ObjectId): Promise<IFlashSale[]> {
    return FlashSaleModel.find({
      'products.productId': new Types.ObjectId(productId.toString()),
    }).lean<IFlashSale[]>()
  }

  async findScheduled(): Promise<IFlashSale[]> {
    return FlashSaleModel.find({ status: 'SCHEDULED' }).lean<IFlashSale[]>()
  }

  async atomicDecrementSold(
    flashSaleId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
    quantity: number,
    session?: ClientSession,
  ): Promise<IFlashSale | null> {
    const productObjId = new Types.ObjectId(productId.toString())
    const saleObjId = new Types.ObjectId(flashSaleId.toString())

    // Atomic: only decrement if soldQuantity + quantity <= totalQuantity
    // Uses arrayFilters with $expr to check the condition on the matched element
    const query = FlashSaleModel.findOneAndUpdate(
      {
        _id: saleObjId,
        status: 'ACTIVE',
        'products.productId': productObjId,
      },
      {
        $inc: { 'products.$[elem].soldQuantity': quantity },
      },
      {
        new: true,
        arrayFilters: [
          {
            'elem.productId': productObjId,
            $expr: {
              $lte: [{ $add: ['$$elem.soldQuantity', quantity] }, '$$elem.totalQuantity'],
            },
          },
        ],
      },
    )

    if (session) {
      return query.session(session).lean<IFlashSale | null>()
    }
    return query.lean<IFlashSale | null>()
  }
}
