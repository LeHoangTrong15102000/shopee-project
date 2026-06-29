import { STATUS_PURCHASE } from '@constants/purchase'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import {
  IPurchaseRepository,
  PurchaseStatus,
} from '@repositories/interfaces/purchase.repository.interface'
import { ISKURepository } from '@repositories/interfaces/sku.repository.interface'
import { IPurchase } from '../@types/models.type'
import { BaseService, NotFoundError, ValidationError } from './base.service'

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

  /**
   * Switch a cart line from currentSkuId to targetSkuId in place.
   * Validates target SKU existence, same-product ownership, and stock.
   * Detects collision and merges if a line for target SKU already exists.
   * Treating switching to the same SKU as a no-op.
   */
  async switchCartItemVariant(
    userId: string,
    productId: string,
    currentSkuId: string,
    targetSkuId: string,
    buyCount?: number,
  ): Promise<IPurchase> {
    // No-op: same SKU requested
    if (currentSkuId === targetSkuId) {
      const cartItem = await this.purchaseRepository.findCartItem(userId, productId, currentSkuId)
      if (!cartItem) throw new NotFoundError('Cart item')
      return cartItem
    }

    if (!this.skuRepository) {
      throw new ValidationError('SKU repository not available')
    }

    // Validate target SKU exists
    const targetSku = await this.skuRepository.findById(targetSkuId)
    if (!targetSku) throw new NotFoundError('SKU', targetSkuId)

    // Validate target SKU belongs to the same product
    const targetSkuProductId =
      targetSku.product instanceof Object && '_id' in (targetSku.product as object)
        ? (targetSku.product as { _id: { toString(): string } })._id.toString()
        : targetSku.product.toString()
    if (targetSkuProductId !== productId) {
      throw new ValidationError('Target SKU does not belong to the same product')
    }

    // Load product for price_before_discount
    const product = await this.productRepository.findById(productId)
    if (!product) throw new NotFoundError('Product', productId)

    // Locate the source line
    const sourceLine = await this.purchaseRepository.findCartItem(userId, productId, currentSkuId)
    if (!sourceLine) throw new NotFoundError('Cart item')

    const effectiveBuyCount = buyCount ?? sourceLine.buy_count

    // Detect collision: does a line for (user, product, target sku, IN_CART) already exist?
    const existingTargetLine = await this.purchaseRepository.findCartItem(
      userId,
      productId,
      targetSkuId,
    )

    if (existingTargetLine) {
      // Merge path: sum buy_counts, validate against target stock
      const mergedBuyCount = effectiveBuyCount + existingTargetLine.buy_count
      if (mergedBuyCount > targetSku.stock) {
        throw new ValidationError('Số lượng hợp nhất vượt quá tồn kho SKU đích')
      }
      const merged = await this.purchaseRepository.mergeAndDeleteSourceLine(
        userId,
        productId,
        currentSkuId,
        targetSkuId,
        mergedBuyCount,
        targetSku.price,
        product.price_before_discount,
      )
      if (!merged) throw new NotFoundError('Cart item')
      return merged
    } else {
      // Switch-in-place path: validate stock for current buy_count
      if (effectiveBuyCount > targetSku.stock) {
        throw new ValidationError('Số lượng mua vượt quá tồn kho SKU đích')
      }
      const switched = await this.purchaseRepository.switchCartItemSku(
        userId,
        productId,
        currentSkuId,
        targetSkuId,
        targetSku.price,
        product.price_before_discount,
      )
      if (!switched) throw new NotFoundError('Cart item')
      return switched
    }
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
      const purchase = await this.purchaseRepository.findByIdAndUser(purchaseId, userId)
      if (purchase && purchase.status === STATUS_PURCHASE.IN_CART) {
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
