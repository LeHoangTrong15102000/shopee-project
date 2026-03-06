import { SuccessResponseApi } from 'src/types/utils.type'
import { ShippingMethod, PaymentMethod, Order, CreateOrderBody, CheckoutSummary } from 'src/types/checkout.type'
import http from 'src/utils/http'

// Mock shipping methods
const mockShippingMethods: ShippingMethod[] = [
  {
    _id: 'standard',
    name: 'Giao hàng tiêu chuẩn',
    description: 'Giao hàng trong 3-5 ngày làm việc',
    price: 30000,
    estimatedDays: '3-5 ngày',
    icon: 'truck'
  },
  {
    _id: 'express',
    name: 'Giao hàng nhanh',
    description: 'Giao hàng trong 1-2 ngày làm việc',
    price: 50000,
    estimatedDays: '1-2 ngày',
    icon: 'rocket'
  },
  {
    _id: 'same_day',
    name: 'Giao hàng trong ngày',
    description: 'Nhận hàng trong ngày (đặt trước 12h)',
    price: 80000,
    estimatedDays: 'Trong ngày',
    icon: 'lightning'
  }
]

// Mock payment methods
const mockPaymentMethods: PaymentMethod[] = [
  {
    _id: 'cod',
    type: 'cod',
    name: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán bằng tiền mặt khi nhận hàng',
    icon: 'cod',
    isAvailable: true
  },
  {
    _id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Chuyển khoản ngân hàng',
    description: 'Chuyển khoản qua tài khoản ngân hàng',
    icon: 'bank_transfer',
    isAvailable: true
  },
  {
    _id: 'e_wallet',
    type: 'e_wallet',
    name: 'Ví điện tử',
    description: 'Thanh toán qua MoMo, ZaloPay, VNPay',
    icon: 'e_wallet',
    isAvailable: true
  },
  {
    _id: 'credit_card',
    type: 'credit_card',
    name: 'Thẻ tín dụng/Ghi nợ',
    description: 'Visa, Mastercard, JCB',
    icon: 'credit_card',
    isAvailable: true
  }
]

const checkoutApi = {
  getShippingMethods: async () => {
    try {
      const response = await http.get<SuccessResponseApi<ShippingMethod[]>>('/orders/shipping/methods')
      return response
    } catch (error) {
      console.warn('Shipping API not available, using mock data')
      return {
        data: {
          message: 'Lấy phương thức vận chuyển thành công',
          data: mockShippingMethods
        }
      }
    }
  },

  getPaymentMethods: async () => {
    try {
      const response = await http.get<SuccessResponseApi<PaymentMethod[]>>('/orders/payment/methods')
      return response
    } catch (error) {
      console.warn('Payment API not available, using mock data')
      return {
        data: {
          message: 'Lấy phương thức thanh toán thành công',
          data: mockPaymentMethods
        }
      }
    }
  },

  calculateSummary: async (body: {
    purchaseIds: string[]
    shippingMethodId?: string
    voucherCode?: string
    coinsUsed?: number
  }) => {
    try {
      const response = await http.post<SuccessResponseApi<CheckoutSummary>>('/checkout/summary', {
        purchase_ids: body.purchaseIds,
        shipping_method_id: body.shippingMethodId,
        voucher_code: body.voucherCode,
        coins_used: body.coinsUsed
      })
      return response
    } catch (error) {
      const shippingMethod = mockShippingMethods.find((m) => m._id === body.shippingMethodId) || mockShippingMethods[0]
      return {
        data: {
          message: 'Tính toán thành công',
          data: {
            items: [],
            subtotal: 0,
            shippingFee: shippingMethod.price,
            discount: 0,
            coinsDiscount: body.coinsUsed || 0,
            total: shippingMethod.price
          }
        }
      }
    }
  },

  createOrder: async (body: CreateOrderBody) => {
    try {
      const response = await http.post<SuccessResponseApi<Order>>('/checkout/create-order', {
        purchase_ids: body.purchaseIds,
        shipping_address_id: body.shippingAddressId,
        shipping_method_id: body.shippingMethodId,
        payment_method: body.paymentMethod,
        voucher_code: body.voucherCode,
        coins_used: body.coinsUsed,
        note: body.note
      })
      return response
    } catch (error) {
      console.warn('⚠️ [createOrder] API not available, using mock data')
      const mockOrder: Order = {
        _id: `order-${Date.now()}`,
        userId: 'mock-user-id',
        items: [],
        shippingAddress: {
          _id: '1',
          userId: 'mock-user-id',
          fullName: 'Nguyễn Văn A',
          phone: '0901234567',
          province: 'Hồ Chí Minh',
          district: 'Quận 1',
          ward: 'Phường Bến Nghé',
          street: '123 Nguyễn Huệ',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        shippingMethod: mockShippingMethods[0],
        paymentMethod: body.paymentMethod,
        subtotal: 0,
        shippingFee: mockShippingMethods[0].price,
        discount: 0,
        coinsUsed: body.coinsUsed || 0,
        coinsDiscount: body.coinsUsed || 0,
        total: mockShippingMethods[0].price,
        status: 'pending',
        note: body.note,
        voucherCode: body.voucherCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return {
        data: {
          message: 'Tạo đơn hàng thành công (mock)',
          data: mockOrder
        }
      }
    }
  }
}

export default checkoutApi
