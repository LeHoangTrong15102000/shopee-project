import { Types, ClientSession } from 'mongoose'
import { IFlashSale } from '../../@types/models.type'
import { IBaseRepository } from './base.repository.interface'

export interface IFlashSaleRepository extends IBaseRepository<IFlashSale> {
  /**
   * Find all currently ACTIVE flash sales (status === ACTIVE and now between startTime and endTime)
   */
  findActive(): Promise<IFlashSale[]>

  /**
   * Find flash sales that contain a specific productId in their products array
   */
  findByProductId(productId: string | Types.ObjectId): Promise<IFlashSale[]>

  /**
   * Find all SCHEDULED flash sales (status === SCHEDULED)
   */
  findScheduled(): Promise<IFlashSale[]>

  /**
   * Atomically decrement soldQuantity for a product in a flash sale.
   * Uses findOneAndUpdate with $inc and condition soldQuantity < totalQuantity.
   * Returns the updated flash sale or null if not found / out of stock.
   */
  atomicDecrementSold(
    flashSaleId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
    quantity: number,
    session?: ClientSession,
  ): Promise<IFlashSale | null>
}
