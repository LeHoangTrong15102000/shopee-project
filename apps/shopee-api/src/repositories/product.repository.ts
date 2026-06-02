import { Types, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { ClientSession } from 'mongoose'
import { ProductModel } from '@database/models/product.model'
import { IProduct } from '../@types/models.type'
import {
  IProductRepository,
  ProductFilterOptions,
  ProductSortOptions,
  CreateProductDTO,
  UpdateProductDTO,
} from './interfaces/product.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'
import { viewCounterService } from '@utils/view-counter.service'

export class ProductRepository implements IProductRepository {
  async findById(id: string | Types.ObjectId): Promise<IProduct | null> {
    return ProductModel.findById(id).populate('category').lean<IProduct | null>()
  }

  async findOne(filter: FilterQuery<IProduct>): Promise<IProduct | null> {
    return ProductModel.findOne(filter).populate('category').lean<IProduct | null>()
  }

  async find(filter: FilterQuery<IProduct>, options?: QueryOptions): Promise<IProduct[]> {
    return ProductModel.find(filter, null, options).populate('category').lean<IProduct[]>()
  }

  async findPaginated(
    filter: FilterQuery<IProduct>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<IProduct>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      ProductModel.find(filter)
        .populate('category')
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IProduct[]>(),
      ProductModel.countDocuments(filter),
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

  async create(data: CreateProductDTO): Promise<IProduct> {
    const product = new ProductModel(data)
    const saved = await product.save()
    return saved.toObject() as IProduct
  }

  async updateById(id: string | Types.ObjectId, data: UpdateProductDTO): Promise<IProduct | null> {
    return ProductModel.findByIdAndUpdate(id, data, { new: true })
      .populate('category')
      .lean<IProduct | null>()
  }

  async updateMany(filter: FilterQuery<IProduct>, data: UpdateQuery<IProduct>): Promise<number> {
    const result = await ProductModel.updateMany(filter, data)
    return result.modifiedCount
  }

  async deleteById(id: string | Types.ObjectId): Promise<IProduct | null> {
    return ProductModel.findByIdAndDelete(id).lean<IProduct | null>()
  }

  async deleteMany(filter: FilterQuery<IProduct>): Promise<number> {
    const result = await ProductModel.deleteMany(filter)
    return result.deletedCount
  }

  async count(filter: FilterQuery<IProduct>): Promise<number> {
    return ProductModel.countDocuments(filter)
  }

  async exists(filter: FilterQuery<IProduct>): Promise<boolean> {
    const doc = await ProductModel.exists(filter)
    return doc !== null
  }

  async findProducts(
    filters: ProductFilterOptions,
    sort: ProductSortOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IProduct>> {
    const condition: FilterQuery<IProduct> = {}

    if (filters.category) {
      condition.category = new Types.ObjectId(filters.category.toString())
    }
    if (filters.name) {
      condition.name = filters.name
    }
    if (filters.exclude) {
      condition._id = { $ne: new Types.ObjectId(filters.exclude.toString()) }
    }
    if (filters.price_min !== undefined || filters.price_max !== undefined) {
      condition.price = {}
      if (filters.price_min !== undefined) condition.price.$gte = filters.price_min
      if (filters.price_max !== undefined) condition.price.$lte = filters.price_max
    }
    if (filters.rating_filter !== undefined) {
      condition.rating = { $gte: filters.rating_filter }
    }
    if (filters.location) {
      condition.location = filters.location
    }

    const sortObj: Record<string, 1 | -1> = {}
    if (sort.sort_by) {
      sortObj[sort.sort_by] = sort.order === 'asc' ? 1 : -1
    } else {
      sortObj.createdAt = -1
    }

    return this.findPaginated(condition, { ...pagination, sort: sortObj })
  }

  async findByCategory(
    categoryId: string | Types.ObjectId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IProduct>> {
    return this.findPaginated({ category: new Types.ObjectId(categoryId.toString()) }, pagination)
  }

  async searchByName(
    query: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IProduct>> {
    const regex = new RegExp(query, 'i')
    return this.findPaginated({ name: regex }, pagination)
  }

  async incrementView(productId: string | Types.ObjectId): Promise<void> {
    // Use batch view counter instead of direct DB update
    viewCounterService.incrementView(productId.toString())
  }

  async incrementSold(
    productId: string | Types.ObjectId,
    count: number,
    options?: { session?: ClientSession },
  ): Promise<void> {
    await ProductModel.findByIdAndUpdate(
      productId,
      { $inc: { sold: count } },
      options?.session ? { session: options.session } : undefined,
    )
  }

  async decrementQuantity(
    productId: string | Types.ObjectId,
    count: number,
    options?: { session?: ClientSession },
  ): Promise<void> {
    await ProductModel.findOneAndUpdate(
      { _id: productId, quantity: { $gte: count } },
      { $inc: { quantity: -count } },
      options?.session ? { session: options.session } : undefined,
    )
  }

  async incrementQuantity(
    productId: string | Types.ObjectId,
    count: number,
    options?: { session?: ClientSession },
  ): Promise<void> {
    await ProductModel.findByIdAndUpdate(
      productId,
      { $inc: { quantity: count } },
      options?.session ? { session: options.session } : undefined,
    )
  }

  async findLowStock(threshold: number): Promise<IProduct[]> {
    return ProductModel.find({ quantity: { $lte: threshold } })
      .populate('category')
      .lean<IProduct[]>()
  }

  async bulkUpdate(
    updates: Array<{ id: string | Types.ObjectId; data: UpdateProductDTO }>,
  ): Promise<number> {
    const bulkOps = updates.map(({ id, data }) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id.toString()) },
        update: { $set: data },
      },
    }))
    const result = await ProductModel.bulkWrite(bulkOps as any)
    return result.modifiedCount
  }

  async bulkUpdateStock(
    updates: Array<{
      product_id: string | Types.ObjectId
      quantity_change: number
      sold_change: number
    }>,
    options?: { session?: ClientSession },
  ): Promise<number> {
    const bulkOps = updates.map(({ product_id, quantity_change, sold_change }) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(product_id.toString()) },
        update: { $inc: { quantity: quantity_change, sold: sold_change } },
      },
    }))
    const result = await ProductModel.bulkWrite(
      bulkOps,
      options?.session ? { session: options.session } : undefined,
    )
    return result.modifiedCount
  }

  async updateRating(productId: string | Types.ObjectId, rating: number): Promise<void> {
    await ProductModel.findByIdAndUpdate(productId, { rating })
  }

  // ─── Admin Inventory Methods ────────────────────────────────────

  async findLowStockPaginated(
    threshold: number,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IProduct>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit
    const filter = { quantity: { $gt: 0, $lte: threshold } }

    const [data, total] = await Promise.all([
      ProductModel.find(filter)
        .populate('category', 'name')
        .sort({ quantity: 1 })
        .skip(skip)
        .limit(limit)
        .lean<IProduct[]>(),
      ProductModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async findOutOfStock(pagination: PaginationOptions): Promise<PaginatedResult<IProduct>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit
    const filter = { quantity: 0 }

    const [data, total] = await Promise.all([
      ProductModel.find(filter)
        .populate('category', 'name')
        .sort({ sold: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IProduct[]>(),
      ProductModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }
}
