import { IPurchase } from '../@types/models.type'
import {
  IPurchaseRepository,
  PurchaseStatus,
} from '@repositories/interfaces/purchase.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { ISKURepository } from '@repositories/interfaces/sku.repository.interface'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError } from './base.service'
import { STATUS_PURCHASE } from '@constants/purchase'

export interface AddToCartDTO {
  product_id: string
  buy_count: number
  sku_id?: string
}

export interface BuyProductDTO {
  product_id: string
  buy_count: number
  sku_id?: string
}

export class PurchaseService extends BaseService {
  constructor(
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly productRepository: IProductRepository,
    private readonly skuRepository?: ISKURepository,
  ) {
    super()
  }

  async addToCart(userId: string, data: AddToCartDTO): Promise<IPurchase> {
    const product = await this.productRepository.findById(data.product_id)
    if (!product) {
      throw new NotFoundError('Product', data.product_id)
    }

    if (data.sku_id && this.skuRepository) {
      const sku = await this.skuRepository.findById(data.sku_id)
      if (!sku) throw new NotFoundError('SKU', data.sku_id)
      if (data.buy_count > sku.stock) {
        throw new ValidationError('Số lượng mua vượt quá tồn kho SKU')
      }
      return this.purchaseRepository.addToCart(
        userId,
        data.product_id,
        data.buy_count,
        sku.price,
        product.price_before_discount,
        data.sku_id,
      )
    } else {
      if (data.buy_count > product.quantity) {
        throw new ValidationError('Số lượng mua vượt quá số lượng sản phẩm')
      }
    }

    return this.purchaseRepository.addToCart(
      userId,
      data.product_id,
      data.buy_count,
      product.price,
      product.price_before_discount,
    )
  }

  async updateCartItem(
    userId: string,
    productId: string,
    buyCount: number,
    skuId?: string,
  ): Promise<IPurchase> {
    const cartItem = await this.purchaseRepository.findCartItem(userId, productId, skuId ?? null)
    if (!cartItem) {
      throw new NotFoundError('Cart item')
    }

    let skuPrice: number | undefined
    if (skuId && this.skuRepository) {
      const sku = await this.skuRepository.findById(skuId)
      if (!sku) throw new NotFoundError('SKU', skuId)
      if (buyCount > sku.stock) {
        throw new ValidationError('Số lượng mua vượt quá tồn kho SKU')
      }
      skuPrice = sku.price
    } else {
      const product = await this.productRepository.findById(productId)
      if (!product) {
        throw new NotFoundError('Product', productId)
      }
      if (buyCount > product.quantity) {
        throw new ValidationError('Số lượng mua vượt quá số lượng sản phẩm')
      }
    }

    const updated = await this.purchaseRepository.updateCartItem(
      cartItem._id!.toString(),
      buyCount,
      skuId,
      skuPrice,
    )
    if (!updated) {
      throw new NotFoundError('Cart item')
    }
    return updated
  }

  async getCart(userId: string): Promise<IPurchase[]> {
    return this.purchaseRepository.findCart(userId)
  }

  async getCartItemsByIds(userId: string, purchaseIds: string[]): Promise<IPurchase[]> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const cart = await this.purchaseRepository.findCart(userId)
    return cart.filter((item) => purchaseIds.includes(item._id?.toString() || ''))
  }

  async removeFromCart(userId: string, purchaseIds: string[]): Promise<number> {
    let deletedCount = 0
    for (const purchaseId of purchaseIds) {
      const purchase = await this.purchaseRepository.findById(purchaseId)
      if (
        purchase &&
        purchase.user?.toString() === userId &&
        purchase.status === STATUS_PURCHASE.IN_CART
      ) {
        const removed = await this.purchaseRepository.removeFromCart(purchaseId)
        if (removed) deletedCount++
      }
    }
    return deletedCount
  }

  async clearCart(userId: string): Promise<number> {
    return this.purchaseRepository.clearCart(userId)
  }

  async buyProducts(userId: string, items: BuyProductDTO[]): Promise<IPurchase[]> {
    const purchases: IPurchase[] = []

    for (const item of items) {
      const product = await this.productRepository.findById(item.product_id)
      if (!product) {
        throw new NotFoundError('Product', item.product_id)
      }

      if (item.sku_id && this.skuRepository) {
        const sku = await this.skuRepository.findById(item.sku_id)
        if (!sku) throw new NotFoundError('SKU', item.sku_id)
        if (item.buy_count > sku.stock) {
          throw new ValidationError(`SKU "${sku.value}" không đủ tồn kho`)
        }
      } else {
        if (item.buy_count > product.quantity) {
          throw new ValidationError(`Số lượng mua vượt quá số lượng sản phẩm: ${product.name}`)
        }
      }

      // Check if item exists in cart
      const cartItem = await this.purchaseRepository.findCartItem(
        userId,
        item.product_id,
        item.sku_id ?? null,
      )

      let purchase: IPurchase | null
      if (cartItem) {
        // Update existing cart item to purchased status
        purchase = await this.purchaseRepository.updateById(cartItem._id!.toString(), {
          buy_count: item.buy_count,
          status: PurchaseStatus.WAIT_FOR_CONFIRMATION,
        })
      } else {
        // Create new purchase
        purchase = await this.purchaseRepository.create({
          user: userId,
          product: item.product_id,
          buy_count: item.buy_count,
          price: product.price,
          price_before_discount: product.price_before_discount,
          status: PurchaseStatus.WAIT_FOR_CONFIRMATION,
        })
      }

      // Update product inventory
      await this.productRepository.decrementQuantity(item.product_id, item.buy_count)
      await this.productRepository.incrementSold(item.product_id, item.buy_count)

      if (purchase) {
        purchases.push(purchase)
      }
    }

    return purchases
  }

  async getPurchases(userId: string, status?: PurchaseStatus): Promise<IPurchase[]> {
    return this.purchaseRepository.findByUser(userId, status)
  }

  async getPurchasesByStatus(
    status: PurchaseStatus,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IPurchase>> {
    return this.purchaseRepository.findByStatus(status, this.normalizePagination(pagination))
  }

  async updatePurchaseStatus(purchaseId: string, status: PurchaseStatus): Promise<IPurchase> {
    const purchase = await this.purchaseRepository.updateStatus(purchaseId, status)
    if (!purchase) {
      throw new NotFoundError('Purchase', purchaseId)
    }
    return purchase
  }

  async getUserStats(userId: string): Promise<{
    total_orders: number
    total_spent: number
    orders_by_status: Record<PurchaseStatus, number>
  }> {
    return this.purchaseRepository.getUserStats(userId)
  }
}
