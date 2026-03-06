import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { orderService, purchaseService, addressService, loyaltyService, voucherService } from '../container'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'
import { emitAdminNewOrderNotification } from '../socket/utils/order-emit'

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
        const voucherResult = await voucherService.applyVoucher({ code: voucher_code, order_value: subtotal })
        voucherDiscount = voucherResult.discount_amount
        appliedVoucher = { code: voucherResult.code, discount: voucherDiscount }
      } catch {
        // Voucher invalid or not applicable - continue without discount
      }
    }

    // Get user's loyalty coins using loyaltyService
    const loyaltyInfo = await loyaltyService.getPoints(user_id)
    const availableCoins = loyaltyInfo?.points?.available_points || 0
    const coinsToUse = Math.min(Number(coins_used), availableCoins, subtotal - voucherDiscount)
    const coinsDiscount = coinsToUse

    // Calculate total
    const total = Math.max(0, subtotal + shippingFee - voucherDiscount - coinsDiscount)

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

    // Create order using orderService
    const order = await orderService.createOrder(user_id, {
      items,
      shipping_address_id,
      shipping_method_id,
      payment_method,
      voucher_code,
      coins_used,
      note,
    })

    // If voucher was used, mark it as used
    if (voucher_code) {
      try {
        const voucherInfo = await voucherService.getVoucherByCode(voucher_code)
        if (voucherInfo.status.is_valid) {
          await voucherService.useVoucher(user_id, voucherInfo.voucher._id.toString(), order._id?.toString())
        }
      } catch {
        // Voucher handling failed - order still created
      }
    }

    // Deduct loyalty coins if used
    if (coins_used > 0) {
      try {
        await loyaltyService.deductPoints(user_id, coins_used, 'Sử dụng xu cho đơn hàng')
      } catch {
        // Coins deduction failed - order still created
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

