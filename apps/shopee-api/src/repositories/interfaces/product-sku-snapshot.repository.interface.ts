import { Types } from 'mongoose'
import { ClientSession } from 'mongoose'
import { IProductSkuSnapshot } from '../../@types/models.type'

/**
 * ProductSkuSnapshot creation data transfer object
 */
export interface CreateProductSkuSnapshotDTO {
  product_name: string
  product_image: string
  sku_price: number
  sku_value: string
  sku_image: string
  variant_values: Record<string, string>
  quantity: number
  sku: Types.ObjectId | null
  product: Types.ObjectId | null
  order: Types.ObjectId | null
}

/**
 * ProductSkuSnapshot repository interface
 */
export interface IProductSkuSnapshotRepository {
  /**
   * Create a single snapshot
   */
  create(data: CreateProductSkuSnapshotDTO): Promise<IProductSkuSnapshot>

  /**
   * Create multiple snapshots (bulk insert)
   */
  createMany(
    data: CreateProductSkuSnapshotDTO[],
    options?: { session?: ClientSession },
  ): Promise<IProductSkuSnapshot[]>

  /**
   * Find all snapshots for an order
   */
  findByOrder(orderId: string | Types.ObjectId): Promise<IProductSkuSnapshot[]>

  /**
   * Find all snapshots for a product
   */
  findByProduct(productId: string | Types.ObjectId): Promise<IProductSkuSnapshot[]>

  /**
   * Find all snapshots for a SKU
   */
  findBySku(skuId: string | Types.ObjectId): Promise<IProductSkuSnapshot[]>
}
