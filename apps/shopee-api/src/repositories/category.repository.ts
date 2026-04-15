import { Types, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { CategoryModel } from '@database/models/category.model'
import { ProductModel } from '@database/models/product.model'
import { ICategory } from '../@types/models.type'
import {
  ICategoryRepository,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from './interfaces/category.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class CategoryRepository implements ICategoryRepository {
  async findById(id: string | Types.ObjectId): Promise<ICategory | null> {
    return CategoryModel.findById(id).lean<ICategory | null>()
  }

  async findOne(filter: FilterQuery<ICategory>): Promise<ICategory | null> {
    return CategoryModel.findOne(filter).lean<ICategory | null>()
  }

  async find(filter: FilterQuery<ICategory>, options?: QueryOptions): Promise<ICategory[]> {
    return CategoryModel.find(filter, null, options).lean<ICategory[]>()
  }

  async findPaginated(
    filter: FilterQuery<ICategory>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<ICategory>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      CategoryModel.find(filter)
        .sort(sort || { name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<ICategory[]>(),
      CategoryModel.countDocuments(filter),
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

  async create(data: CreateCategoryDTO): Promise<ICategory> {
    const category = new CategoryModel(data)
    const saved = await category.save()
    return saved.toObject() as ICategory
  }

  async updateById(
    id: string | Types.ObjectId,
    data: UpdateCategoryDTO,
  ): Promise<ICategory | null> {
    return CategoryModel.findByIdAndUpdate(id, data, { new: true }).lean<ICategory | null>()
  }

  async updateMany(filter: FilterQuery<ICategory>, data: UpdateQuery<ICategory>): Promise<number> {
    const result = await CategoryModel.updateMany(filter, data)
    return result.modifiedCount
  }

  async deleteById(id: string | Types.ObjectId): Promise<ICategory | null> {
    return CategoryModel.findByIdAndDelete(id).lean<ICategory | null>()
  }

  async deleteMany(filter: FilterQuery<ICategory>): Promise<number> {
    const result = await CategoryModel.deleteMany(filter)
    return result.deletedCount
  }

  async count(filter: FilterQuery<ICategory>): Promise<number> {
    return CategoryModel.countDocuments(filter)
  }

  async exists(filter: FilterQuery<ICategory>): Promise<boolean> {
    const doc = await CategoryModel.exists(filter)
    return doc !== null
  }

  async findByName(name: string): Promise<ICategory | null> {
    return CategoryModel.findOne({ name }).lean<ICategory | null>()
  }

  async nameExists(name: string, excludeId?: string | Types.ObjectId): Promise<boolean> {
    const filter: FilterQuery<ICategory> = { name }
    if (excludeId) {
      filter._id = { $ne: new Types.ObjectId(excludeId.toString()) }
    }
    const doc = await CategoryModel.exists(filter)
    return doc !== null
  }

  async findAll(): Promise<ICategory[]> {
    return CategoryModel.find({}).sort({ name: 1 }).lean<ICategory[]>()
  }

  async findAllWithProductCount(): Promise<Array<ICategory & { productCount: number }>> {
    const categories = await CategoryModel.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          productCount: { $size: '$products' },
        },
      },
      { $sort: { name: 1 } },
    ])
    return categories
  }

  async searchByName(query: string): Promise<ICategory[]> {
    const regex = new RegExp(query, 'i')
    return CategoryModel.find({ name: regex }).sort({ name: 1 }).lean<ICategory[]>()
  }
}
