import { Request, Response } from 'express'
import { STATUS_PURCHASE, StatusPurchaseType } from '@constants/purchase'
import { STATUS } from '@constants/status'
import { ProductModel } from '@database/models/product.model'
import { PurchaseModel } from '@database/models/purchase.model'
import { SKUModel } from '@database/models/sku.model'
import { startSession } from '@database/database'
import { ErrorHandler, responseSuccess, NotFoundError as HttpNotFoundError } from '@utils/response'
import { handleImageProduct } from './product.controller'
import { cloneDeep } from 'lodash'
import { FilterQuery } from 'mongoose'
import { IProduct, IPurchase, ISKU } from '../@types/models.type'
import { PurchaseBody, BuyProductItem } from '../@types/request.type'
import { PURCHASE_MESSAGES, PRODUCT_MESSAGES } from '@constants/messages'
import { emitCartUpdate } from '../socket/utils/cart-emit'
import { emitActivityEvent } from '../socket/utils/activity-emit'
import { emitSellerOrderNotification } from '../socket/utils/seller-emit'
import { emitCurrentSellerMetrics } from '../socket/utils/seller-metrics.service'
import { emitAdminNewOrderNotification } from '../socket/utils/order-emit'
import { getIO } from '../socket/socket.init'
import { SOCKET_CONFIG } from '@constants/socket'
import { purchaseService, flashSaleService } from '../container'
import { NotFoundError, ValidationError } from '@services/base.service'

interface IPurchasePopulated extends Omit<IPurchase, 'product'> {
  product: IProduct
}

export const addToCart = async (req: Request, res: Response) => {
  try {
    const { product_id, buy_count, sku_id }: PurchaseBody = req.body
    const data = await purchaseService.addToCart(req.jwtDecoded.id, {
      product_id,
      buy_count,
      sku_id,
    })

    // Emit cart update for cross-device sync
    emitCartUpdate(req.jwtDecoded.id, 'add', product_id)

    const response = {
      message: PURCHASE_MESSAGES.ADD_TO_CART_SUCCESS,
      data,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new HttpNotFoundError(PRODUCT_MESSAGES.NOT_FOUND)
    }
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.NOT_ACCEPTABLE, PRODUCT_MESSAGES.QUANTITY_EXCEEDED)
    }
    throw error
  }
}

export const updatePurchase = async (req: Request, res: Response) => {
  try {
    const { product_id, buy_count, sku_id }: PurchaseBody = req.body
    const data = await purchaseService.updateCartItem(
      req.jwtDecoded.id,
      product_id,
      buy_count,
      sku_id,
    )

    // Emit cart update for cross-device sync
    emitCartUpdate(req.jwtDecoded.id, 'update', product_id)

    const response = {
      message: PURCHASE_MESSAGES.UPDATE_SUCCESS,
      data,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new HttpNotFoundError(PURCHASE_MESSAGES.NOT_FOUND)
    }
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.NOT_ACCEPTABLE, PRODUCT_MESSAGES.QUANTITY_EXCEEDED)
    }
    throw error
  }
}

export const buyProducts = async (req: Request, res: Response) => {
  const items: BuyProductItem[] = req.body
  const session = await startSession()
  session.startTransaction()

  try {
    const purchases: IPurchasePopulated[] = []

    for (const item of items) {
      const product = await ProductModel.findById(item.product_id)
        .session(session)
        .lean<IProduct | null>()
      if (!product) {
        throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND)
      }

      // SKU-based stock check
      let sku: ISKU | null = null
      if (item.sku_id) {
        sku = await SKUModel.findById(item.sku_id).session(session).lean<ISKU | null>()
        if (!sku) {
          throw new NotFoundError('SKU không tồn tại')
        }
        if (item.buy_count > sku.stock) {
          throw new ErrorHandler(STATUS.NOT_ACCEPTABLE, `SKU "${sku.value}" không đủ tồn kho`)
        }
      } else {
        if (item.buy_count > product.quantity) {
          throw new ErrorHandler(STATUS.NOT_ACCEPTABLE, PRODUCT_MESSAGES.BUY_QUANTITY_EXCEEDED)
        }
      }

      const updateFields: Record<string, any> = {
        buy_count: item.buy_count,
        status: STATUS_PURCHASE.WAIT_FOR_CONFIRMATION,
      }
      if (item.sku_id) {
        updateFields.sku = item.sku_id
        updateFields.price = sku!.price
      }

      let data = await PurchaseModel.findOneAndUpdate(
        {
          user: req.jwtDecoded.id,
          status: STATUS_PURCHASE.IN_CART,
          product: {
            _id: item.product_id,
          },
        },
        updateFields,
        {
          new: true,
          session,
        },
      )
        .populate({
          path: 'product',
          populate: {
            path: 'category',
          },
        })
        .lean<IPurchasePopulated | null>()

      if (!data) {
        const purchase: Record<string, any> = {
          user: req.jwtDecoded.id,
          product: item.product_id,
          buy_count: item.buy_count,
          price: item.sku_id && sku ? sku.price : product.price,
          price_before_discount: product.price_before_discount,
          status: STATUS_PURCHASE.WAIT_FOR_CONFIRMATION,
        }
        if (item.sku_id) {
          purchase.sku = item.sku_id
        }
        const addedPurchase = await new PurchaseModel(purchase).save({ session })
        data = await PurchaseModel.findById(addedPurchase._id)
          .session(session)
          .populate({
            path: 'product',
            populate: {
              path: 'category',
            },
          })
          .lean<IPurchasePopulated | null>()
      }

      // Decrement stock from the correct source
      if (item.sku_id) {
        // SKU-based: atomic decrement SKU stock
        const decremented = await SKUModel.findOneAndUpdate(
          { _id: item.sku_id, stock: { $gte: item.buy_count } },
          { $inc: { stock: -item.buy_count } },
          { new: true, session },
        )
        if (!decremented) {
          throw new ErrorHandler(STATUS.NOT_ACCEPTABLE, `SKU không đủ tồn kho`)
        }
      }

      // Always decrement product quantity and increment sold (for both SKU and legacy)
      await ProductModel.findByIdAndUpdate(
        item.product_id,
        {
          $inc: {
            quantity: -item.buy_count,
            sold: item.buy_count,
          },
        },
        { session },
      )

      if (data) {
        purchases.push(data)
      }
    }

    // Flash sale stock decrement — blocking, inside transaction for atomicity.
    // Auto-detect flash sale items by matching productId against active sales.
    const activeSales = await flashSaleService.getActive()
    const flashSaleUpdates: Array<{
      saleId: string
      productId: string
      remainingQuantity: number
      soldQuantity: number
    }> = []

    if (activeSales.length > 0) {
      for (const item of items) {
        for (const sale of activeSales) {
          const saleProduct = sale.products.find((p) => p.productId.toString() === item.product_id)
          if (saleProduct) {
            // Blocking call inside transaction — throws if sold out or limit exceeded
            const updated = await flashSaleService.purchaseFlashSaleItem(
              sale._id!.toString(),
              item.product_id,
              req.jwtDecoded.id,
              item.buy_count,
              session,
            )
            // Collect updated stock for post-commit WebSocket broadcast
            const updatedProduct = updated.products.find(
              (p) => p.productId.toString() === item.product_id,
            )
            if (updatedProduct) {
              flashSaleUpdates.push({
                saleId: sale._id!.toString(),
                productId: item.product_id,
                remainingQuantity: updatedProduct.totalQuantity - updatedProduct.soldQuantity,
                soldQuantity: updatedProduct.soldQuantity,
              })
            }
          }
        }
      }
    }

    await session.commitTransaction()

    // Broadcast flash sale stock updates after successful commit (fire-and-forget)
    if (flashSaleUpdates.length > 0) {
      void (() => {
        try {
          const { emitFlashSaleStockUpdate } = require('../socket/utils/flash-sale-emit')
          for (const update of flashSaleUpdates) {
            emitFlashSaleStockUpdate(
              update.saleId,
              update.productId,
              update.remainingQuantity,
              update.soldQuantity,
            )
          }
        } catch (_) {
          /* non-critical */
        }
      })()
    }

    // Emit cart update for cross-device sync
    emitCartUpdate(req.jwtDecoded.id, 'buy')

    // Activity feed: emit anonymized purchase activity for each product (fire-and-forget)
    void (() => {
      try {
        for (const item of items) {
          emitActivityEvent(item.product_id, 'purchase', 'Ai đó vừa mua sản phẩm này')
        }
      } catch (_) {
        /* non-critical */
      }
    })()

    // Seller dashboard: emit order notification + metrics update (fire-and-forget)
    void (async () => {
      try {
        const io = getIO()
        if (!io) return

        const productNames = purchases
          .map((p) => (p.product as any)?.name || 'Sản phẩm')
          .slice(0, 3)
        const total = purchases.reduce((sum, p) => sum + (p.price || 0) * (p.buy_count || 0), 0)

        const rooms = io.sockets.adapter.rooms
        const sellerPrefix = SOCKET_CONFIG.ROOM_PREFIX.SELLER
        for (const [roomName, sockets] of rooms) {
          if (roomName.startsWith(sellerPrefix) && sockets.size > 0) {
            const sellerId = roomName.slice(sellerPrefix.length)
            emitSellerOrderNotification(sellerId, {
              order_id: purchases[0]?._id?.toString() || 'unknown',
              status: 'wait_for_confirmation',
              product_names: productNames,
              total,
              timestamp: new Date().toISOString(),
            })
            await emitCurrentSellerMetrics(sellerId)
          }
        }
      } catch (_) {
        /* non-critical */
      }
    })()

    // Admin new order notification (fire-and-forget)
    emitAdminNewOrderNotification({
      order_id: purchases[0]?._id?.toString() || 'unknown',
      buyer_name: req.jwtDecoded.name || req.jwtDecoded.email || 'Khách hàng',
      items_count: purchases.length,
      total_amount: purchases.reduce((sum, p) => sum + (p.price || 0) * (p.buy_count || 0), 0),
      created_at: new Date().toISOString(),
    })

    const response = {
      message: PURCHASE_MESSAGES.BUY_SUCCESS,
      data: purchases,
    }
    return responseSuccess(res, response)
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

export const getPurchases = async (req: Request, res: Response) => {
  const { status = STATUS_PURCHASE.ALL } = req.query
  const user_id = req.jwtDecoded.id

  const statusNum = Number(status) as StatusPurchaseType
  const purchaseStatus = statusNum !== STATUS_PURCHASE.ALL ? statusNum : undefined
  const purchases = await purchaseService.getPurchases(user_id, purchaseStatus)

  // Handle image URLs for products
  const processedPurchases = purchases.map((purchase) => {
    if (purchase.product && typeof purchase.product === 'object') {
      const productCopy = cloneDeep(purchase.product as IProduct)
      return {
        ...purchase,
        product: handleImageProduct(productCopy),
      }
    }
    return purchase
  })

  const response = {
    message: PURCHASE_MESSAGES.GET_SUCCESS,
    data: processedPurchases,
  }
  return responseSuccess(res, response)
}

export const deletePurchases = async (req: Request, res: Response) => {
  const purchase_ids: string[] = req.body
  const user_id = req.jwtDecoded.id

  const deletedCount = await purchaseService.removeFromCart(user_id, purchase_ids)

  // Emit cart update for cross-device sync
  emitCartUpdate(req.jwtDecoded.id, 'delete')

  return responseSuccess(res, {
    message: PURCHASE_MESSAGES.DELETE_SUCCESS(deletedCount),
    data: { deleted_count: deletedCount },
  })
}
