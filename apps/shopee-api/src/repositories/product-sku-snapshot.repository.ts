import { Types } from 'mongoose'
import { ClientSession } from 'mongoose'
import { ProductSkuSnapshotModel } from '@database/models/product-sku-snapshot.model'
import { IProductSkuSnapshot } from '../@types/models.type'
import {
  IProductSkuSnapshotRepository,
  CreateProductSkuSnapshotDTO,
} from './interfaces/product-sku-snapshot.repository.interface'

export class ProductSkuSnapshotRepository implements IProductSkuSnapshotRepository {
  async create(data: CreateProductSkuSnapshotDTO): Promise<IProductSkuSnapshot> {
    const snapshot = await new ProductSkuSnapshotModel(data).save()
    return snapshot.toObject() as IProductSkuSnapshot
  }

  async createMany(
    data: CreateProductSkuSnapshotDTO[],
    options?: { session?: ClientSession },
  ): Promise<IProductSkuSnapshot[]> {
    const docs = data.map((d) => new ProductSkuSnapshotModel(d))
    const sessionOpt = options?.session ? { session: options.session } : undefined
    await ProductSkuSnapshotModel.bulkSave(docs, sessionOpt)
    return docs.map((s) => s.toObject() as IProductSkuSnapshot)
  }

  async findByOrder(orderId: string | Types.ObjectId): Promise<IProductSkuSnapshot[]> {
    return ProductSkuSnapshotModel.find({ order: orderId })
      .populate('sku')
      .populate('product')
      .lean<IProductSkuSnapshot[]>()
  }

  async findByProduct(productId: string | Types.ObjectId): Promise<IProductSkuSnapshot[]> {
    return ProductSkuSnapshotModel.find({ product: productId }).lean<IProductSkuSnapshot[]>()
  }

  async findBySku(skuId: string | Types.ObjectId): Promise<IProductSkuSnapshot[]> {
    return ProductSkuSnapshotModel.find({ sku: skuId }).lean<IProductSkuSnapshot[]>()
  }
}
