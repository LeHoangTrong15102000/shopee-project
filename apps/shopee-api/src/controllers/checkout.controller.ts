import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import {
  orderService,
  purchaseService,
  addressService,
  loyaltyService,
  voucherService,
  paymentService,
  bundleService,
} from '../container'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'
import { emitAdminNewOrderNotification } from '../socket/utils/order-emit'
import { Logger } from '@utils/logger'

export const getCheckoutSummary = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const { purchase_ids, voucher_code, coins_used = 0, shipping_method_id = 'standard' } = req.body

    // Get purchases from cart using purchaseService
    const purchases = await purchaseService.getCartItemsByIds(user_id, purchase_ids)

    if (purchases.length === 0) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không có sản phẩm nào trong giỏ hàng')
    }

    // Calculate subtotal
    let subtotal = 0
    const items = purchases.map((purchase) => {
      const product = purchase.product as any
      const itemTotal = product.price * purchase.buy_count
      subtotal += itemTotal
      return {
        product_id: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        price_before_discount: product.price_before_discount,
        buy_count: purchase.buy_count,
        item_total: itemTotal,
      }
    })

    // Get shipping methods from orderService
    const shippingMethods = orderService.getShippingMethods()
    const shippingMethod = shippingMethods.find((m) => m.id === shipping_method_id)
    const shippingFee = shippingMethod?.price || 30000

    // Calculate voucher discount using voucherService
    let voucherDiscount = 0
    let appliedVoucher = null
    if (voucher_code) {
      try {
        const voucherResult = await voucherService.applyVoucher({
          code: voucher_code,
          order_value: subtotal,
        })
        voucherDiscount = voucherResult.discount_amount
        appliedVoucher = { code: voucherResult.code, discount: voucherDiscount }
      } catch (err) {
        // Voucher invalid or not applicable - continue without discount
        Logger.apiWarn('[Checkout] Voucher apply failed in summary', {
          voucher_code,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Calculate bundle discount
    const cartItemsForBundle = purchases.map((purchase) => {
      const product = purchase.product as any
      return {
        productId: product._id.toString(),
        quantity: purchase.buy_count,
        price: product.price,
      }
    })
    let bundleDiscount = 0
    let appliedBundle = null
    try {
      const activeBundles = await bundleService.getActiveBundles()
      const bundleResult = bundleService.calculateBundleDiscount(activeBundles, cartItemsForBundle)
      if (bundleResult) {
        bundleDiscount = bundleResult.discountAmount
        appliedBundle = {
          bundleId: bundleResult.bundle._id?.toString(),
          name: bundleResult.bundle.name,
          discountAmount: bundleResult.discountAmount,
        }
      }
    } catch (err) {
      Logger.apiWarn('[Checkout] Bundle discount calculation failed', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Get user's loyalty coins using loyaltyService
    const loyaltyInfo = await loyaltyService.getPoints(user_id)
    const availableCoins = loyaltyInfo?.points?.available_points || 0
    const coinsToUse = Math.min(Number(coins_used), availableCoins, subtotal - voucherDiscount)
    const coinsDiscount = coinsToUse

    // Calculate total
    const total = Math.max(0, subtotal + shippingFee - voucherDiscount - coinsDiscount - bundleDiscount)

    // Get default address using addressService
    const defaultAddress = await addressService.getDefaultAddress(user_id)

    return responseSuccess(res, {
      message: 'Lấy thông tin checkout thành công',
      data: {
        items,
        subtotal,
        shipping_fee: shippingFee,
        shipping_methods: shippingMethods,
        voucher_discount: voucherDiscount,
        applied_voucher: appliedVoucher,
        bundle_discount: bundleDiscount,
        applied_bundle: appliedBundle,
        coins_discount: coinsDiscount,
        coins_used: coinsToUse,
        available_coins: availableCoins,
        total,
        default_address: defaultAddress,
      },
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    throw error
  }
}

export const createCheckoutOrder = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const {
      purchase_ids,
      shipping_address_id,
      shipping_method_id,
      payment_method,
      voucher_code,
      coins_used = 0,
      note,
    } = req.body

    // Get purchases from cart
    const purchases = await purchaseService.getCartItemsByIds(user_id, purchase_ids)

    if (purchases.length === 0) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không có sản phẩm nào trong giỏ hàng')
    }

    // Build items for order creation
    const items = purchases.map((purchase) => {
      const product = purchase.product as any
      return {
        product_id: product._id.toString(),
        buy_count: purchase.buy_count,
      }
    })

    // Calculate voucher discount before creating order
    let voucherDiscount = 0
    if (voucher_code) {
      try {
        const subtotal = purchases.reduce((sum, p) => {
          const product = p.product as any
          return sum + product.price * p.buy_count
        }, 0)
        const voucherResult = await voucherService.applyVoucher({
          code: voucher_code,
          order_value: subtotal,
        })
        voucherDiscount = voucherResult.discount_amount
      } catch (err) {
        // Voucher invalid - continue without discount
        Logger.apiWarn('[Checkout] Voucher apply failed in create-order', {
          voucher_code,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Create order using orderService
    const order = await orderService.createOrder(user_id, {
      items,
      shipping_address_id,
      shipping_method_id,
      payment_method,
      voucher_code,
      voucher_discount: voucherDiscount,
      coins_used,
      note,
    })

    // If voucher was used, mark it as used
    if (voucher_code) {
      try {
        const voucherInfo = await voucherService.getVoucherByCode(voucher_code)
        if (voucherInfo.status.is_valid) {
          await voucherService.useVoucher(
            user_id,
            voucherInfo.voucher._id.toString(),
            order._id?.toString(),
          )
        }
      } catch (err) {
        Logger.apiWarn('[Checkout] Voucher mark-used failed — order still created', {
          voucher_code,
          orderId: order._id?.toString(),
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Deduct loyalty coins if used
    if (coins_used > 0) {
      try {
        await loyaltyService.deductPoints(user_id, coins_used, 'Sử dụng xu cho đơn hàng')
      } catch (err) {
        Logger.apiWarn('[Checkout] Coins deduction failed — order still created', {
          coins_used,
          orderId: order._id?.toString(),
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Admin new order notification (fire-and-forget)
    emitAdminNewOrderNotification({
      order_id: order._id?.toString() || 'unknown',
      buyer_name: req.jwtDecoded.name || req.jwtDecoded.email || 'Khách hàng',
      items_count: items.length,
      total_amount: (order as any).total || 0,
      created_at: new Date().toISOString(),
    })

    return responseSuccess(res, {
      message: 'Đặt hàng thành công',
      data: order,
    })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BusinessError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
    }
    throw error
  }
}

/**
 * POST /checkout/initiate-payment
 * Creates a PaymentSession for MoMo/VNPay e-wallet payments.
 * Returns { sessionId, payment_url } for frontend redirect.
 */
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const {
      purchase_ids,
      shipping_address_id,
      shipping_method_id,
      payment_method,
      e_wallet_provider,
      voucher_code,
      coins_used = 0,
      note,
      return_url,
    } = req.body

    // Validate e_wallet_provider
    const validProviders = ['momo', 'vnpay']
    if (!e_wallet_provider || !validProviders.includes(e_wallet_provider.toLowerCase())) {
      throw new ErrorHandler(
        STATUS.BAD_REQUEST,
        `Invalid e_wallet_provider. Must be one of: ${validProviders.join(', ')}`,
      )
    }

    // Get purchases from cart
    const purchases = await purchaseService.getCartItemsByIds(user_id, purchase_ids)
    if (purchases.length === 0) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, 'Không có sản phẩm nào trong giỏ hàng')
    }

    // Calculate subtotal
    const subtotal = purchases.reduce((sum, p) => {
      const product = p.product as any
      return sum + product.price * p.buy_count
    }, 0)

    // Get shipping method
    const shippingMethods = orderService.getShippingMethods()
    const shippingMethod = shippingMethods.find((m) => m.id === shipping_method_id)
    const shippingFee = shippingMethod?.price || 30000

    // Calculate voucher discount
    let voucherDiscount = 0
    if (voucher_code) {
      try {
        const voucherResult = await voucherService.applyVoucher({
          code: voucher_code,
          order_value: subtotal,
        })
        voucherDiscount = voucherResult.discount_amount
      } catch (err) {
        Logger.apiWarn('[Checkout] Voucher apply failed in initiate-payment', {
          voucher_code,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Calculate coins discount
    let coinsDiscount = 0
    if (coins_used > 0) {
      try {
        const loyaltyInfo = await loyaltyService.getPoints(user_id)
        const availableCoins = loyaltyInfo?.points?.available_points || 0
        coinsDiscount = Math.min(Number(coins_used), availableCoins, subtotal - voucherDiscount)
      } catch (err) {
        Logger.apiWarn('[Checkout] Coins lookup failed in initiate-payment', {
          coins_used,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const amount = Math.max(0, subtotal + shippingFee - voucherDiscount - coinsDiscount)

    // Build cart items snapshot
    const cartItems = purchases.map((purchase) => {
      const product = purchase.product as any
      return {
        productId: product._id.toString(),
        buyCount: purchase.buy_count,
        price: product.price,
      }
    })

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1'

    const result = await paymentService.createPaymentSession(user_id, {
      cartItems,
      shippingAddressId: shipping_address_id,
      shippingMethodId: shipping_method_id,
      paymentMethod: payment_method,
      eWalletProvider: e_wallet_provider.toLowerCase(),
      voucherCode: voucher_code,
      coinsUsed: coinsDiscount,
      note,
      amount,
      clientIp,
      returnUrl: return_url,
    })

    return responseSuccess(res, {
      message: 'Khởi tạo thanh toán thành công',
      data: {
        sessionId: result.sessionId,
        payment_url: result.payment_url,
      },
    })
  } catch (error) {
    if (error instanceof ErrorHandler) throw error
    if (error instanceof ValidationError || error instanceof BusinessError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
    }
    throw error
  }
}

/**
 * GET /checkout/session-status/:sessionId
 * Returns the current status of a PaymentSession.
 */
export const getSessionStatus = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const sessionId = req.params.sessionId as string

    const result = await paymentService.getSessionStatus(sessionId, user_id)

    return responseSuccess(res, {
      message: 'Lấy trạng thái phiên thanh toán thành công',
      data: result,
    })
  } catch (error) {
    const err = error as any
    if (err.statusCode === 404) {
      throw new ErrorHandler(STATUS.NOT_FOUND, err.message)
    }
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, (error as ValidationError).message)
    }
    throw error
  }
}
