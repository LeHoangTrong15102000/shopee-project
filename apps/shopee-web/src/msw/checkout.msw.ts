import { http, HttpResponse } from 'msw'
import config from 'src/constant/config'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'
import { gated } from 'src/mocks/mockControl'
import {
  Address,
  ShippingMethod,
  PaymentMethod,
  Order,
  OrderStatus,
  CreateOrderBody,
  CheckoutSummary,
  InitiatePaymentResponse,
  PaymentSessionStatusResponse,
} from 'src/types/checkout.type'

const mockShippingMethods: ShippingMethod[] = [
  {
    _id: 'instant',
    name: 'Instant',
    description: 'Super fast delivery within 4 hours',
    price: 112600,
    estimatedDays: '4 hours',
    icon: 'truck',
    type: 'instant',
    deliveryHours: 4,
    details: [
      { text: 'Get ₫20,000 voucher if order arrives late', type: 'voucher' },
      { text: 'Free shipping for orders over ₫0', type: 'free_threshold' },
      { text: 'This channel does not support Shopee Inspection', type: 'note' },
    ],
  },
  {
    _id: 'bulky',
    name: 'Bulky Items',
    description: 'Specialized delivery for large items',
    price: 30800,
    estimatedDays: '2-4 days',
    icon: 'box',
    type: 'standard',
    details: [
      { text: 'Get ₫15,000 voucher if order arrives late', type: 'voucher' },
      { text: '95% off for orders over ₫100,000 (max ₫200,000 discount)', type: 'discount' },
      { text: 'Free shipping for orders over ₫500,000', type: 'free_threshold' },
      { text: 'Free shipping for orders over ₫1,000,000', type: 'free_threshold' },
    ],
  },
  {
    _id: 'express',
    name: 'Express',
    description: 'Fast delivery in 1-2 days',
    price: 30800,
    estimatedDays: '1 day',
    icon: 'rocket',
    type: 'express',
    details: [
      { text: 'Get ₫15,000 voucher if order arrives late', type: 'voucher' },
      { text: 'Free shipping for orders over ₫0', type: 'free_threshold' },
    ],
  },
  {
    _id: 'economy',
    name: 'Economy',
    description: 'Affordable delivery in 3-5 days',
    price: 16500,
    estimatedDays: '3-5 days',
    icon: 'standard',
    type: 'economy',
    details: [
      { text: 'Get ₫15,000 voucher if order arrives late', type: 'voucher' },
      { text: 'Free shipping for orders over ₫0', type: 'free_threshold' },
    ],
  },
  {
    _id: 'pickup',
    name: 'Pickup Locker',
    description: 'Pick up at a pickup point',
    price: 30800,
    estimatedDays: '2-3 days',
    icon: 'locker',
    type: 'pickup',
    details: [{ text: 'Free shipping for orders over ₫0', type: 'free_threshold' }],
  },
]

const mockPaymentMethods: PaymentMethod[] = [
  {
    _id: 'cod',
    type: 'cod',
    name: 'Cash on Delivery (COD)',
    description: 'Pay with cash when you receive the order',
    icon: 'cod',
    isAvailable: true,
  },
  {
    _id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Transfer via bank account',
    icon: 'bank_transfer',
    isAvailable: true,
  },
  {
    _id: 'e_wallet',
    type: 'e_wallet',
    name: 'E-Wallet',
    description: 'Pay via MoMo, ZaloPay, VNPay',
    icon: 'e_wallet',
    isAvailable: true,
  },
  {
    _id: 'credit_card',
    type: 'credit_card',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, JCB',
    icon: 'credit_card',
    isAvailable: true,
  },
]

// Kept in sync with sampleAddresses in address.msw.ts.
// Used here only for createMockOrder and sampleOrders fixtures; all /addresses*
// route handlers now live exclusively in address.msw.ts.
// Both lists share _id '1'..'5', so the data MUST match or the same id would
// resolve to a different person across handlers.
const mockAddresses: Address[] = [
  {
    _id: '1',
    userId: 'user1',
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    street: '123 Đường Lê Lợi',
    addressType: 'home',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '2',
    userId: 'user1',
    fullName: 'Nguyễn Văn A',
    phone: '0909876543',
    province: 'Hồ Chí Minh',
    district: 'Quận 7',
    ward: 'Phường Tân Phú',
    street: '456 Đường Nguyễn Văn Linh',
    addressType: 'home',
    isDefault: false,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    _id: '3',
    userId: 'user1',
    fullName: 'Trần Thị B',
    phone: '0912345678',
    province: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    ward: 'Phường Dịch Vọng',
    street: '789 Đường Xuân Thủy',
    addressType: 'office',
    label: 'Văn phòng công ty',
    isDefault: false,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
  {
    _id: '4',
    userId: 'user1',
    fullName: 'Lê Văn C',
    phone: '0923456789',
    province: 'Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Thạch Thang',
    street: '321 Đường Nguyễn Văn Linh',
    addressType: 'home',
    isDefault: false,
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z',
  },
  {
    _id: '5',
    userId: 'user1',
    fullName: 'Phạm Thị D',
    phone: '0934567890',
    province: 'Cần Thơ',
    district: 'Quận Ninh Kiều',
    ward: 'Phường An Hòa',
    street: '654 Đường 30 Tháng 4',
    addressType: 'other',
    label: 'Nhà bà ngoại',
    isDefault: false,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
]

const sampleProduct = {
  _id: '60afb2426ef5b902180aacb9',
  name: 'Điện thoại OPPO A12 (3GB/32GB) - Hàng chính hãng',
  price: 2590000,
  price_before_discount: 3490000,
  image: 'https://api-ecom.duthanhduoc.com/images/aa374023-7a5b-46ea-aca3-dad1b29fb015.jpg',
  quantity: 73,
  images: ['https://api-ecom.duthanhduoc.com/images/aa374023-7a5b-46ea-aca3-dad1b29fb015.jpg'],
  rating: 4.2,
  sold: 6800,
  view: 3359,
  category: { _id: '60afafe76ef5b902180aacb5', name: 'Điện thoại' },
  description: 'Điện thoại OPPO A12 chính hãng',
  location: 'Hồ Chí Minh',
  createdAt: '2021-05-27T14:52:50.392Z',
  updatedAt: '2022-12-19T15:19:53.312Z',
}

const createMockOrder = (body: CreateOrderBody, id: string): Order => {
  const shippingMethod =
    mockShippingMethods.find((m) => m._id === body.shippingMethodId) || mockShippingMethods[0]
  const shippingAddress =
    mockAddresses.find((a) => a._id === body.shippingAddressId) || mockAddresses[0]
  const subtotal = body.purchaseIds.length * sampleProduct.price

  return {
    _id: id,
    userId: 'user1',
    items: body.purchaseIds.map(() => ({
      product: sampleProduct,
      buyCount: 1,
      price: sampleProduct.price,
      priceBeforeDiscount: sampleProduct.price_before_discount,
    })),
    shippingAddress,
    shippingMethod,
    paymentMethod: body.paymentMethod,
    subtotal,
    shippingFee: shippingMethod.price,
    discount: 0,
    coinsUsed: body.coinsUsed || 0,
    coinsDiscount: body.coinsUsed || 0,
    total: subtotal + shippingMethod.price - (body.coinsUsed || 0),
    status: 'pending' as OrderStatus,
    note: body.note,
    voucherCode: body.voucherCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Shipping Methods Handlers
export const getShippingMethodsRequest = gated(
  'checkout',
  http.get(`${config.baseUrl}orders/shipping/methods`, () => {
    return HttpResponse.json(
      { message: 'Get shipping methods successfully', data: mockShippingMethods },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

// Payment Methods Handlers
export const getPaymentMethodsRequest = gated(
  'checkout',
  http.get(`${config.baseUrl}orders/payment/methods`, () => {
    return HttpResponse.json(
      { message: 'Get payment methods successfully', data: mockPaymentMethods },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

// Checkout Calculate Handler
export const calculateCheckoutRequest = gated(
  'checkout',
  http.post(`${config.baseUrl}checkout/summary`, async ({ request }) => {
    const rawBody = (await request.json()) as {
      purchase_ids: string[]
      shipping_method_id?: string
      voucher_code?: string
      coins_used?: number
    }
    const shippingMethod =
      mockShippingMethods.find((m) => m._id === rawBody.shipping_method_id) ||
      mockShippingMethods[0]
    const subtotal = rawBody.purchase_ids.length * sampleProduct.price
    const coinsDiscount = rawBody.coins_used || 0

    // Calculate voucher discount based on code
    let discount = 0
    const code = (rawBody.voucher_code || '').toUpperCase()
    if (code === 'GIAM10') {
      discount = 10000
    } else if (code === 'GIAM50K') {
      discount = 50000
    } else if (code === 'DISCOUNT50') {
      discount = 50000
    } else if (code === 'FREESHIP') {
      discount = 30000
    } else if (code === 'NEWUSER') {
      discount = 100000
    } else if (code && code !== '') {
      // Invalid voucher — return error
      return HttpResponse.json({ message: 'Invalid voucher code' }, { status: 400 })
    }

    const summary: CheckoutSummary = {
      items: rawBody.purchase_ids.map(() => ({
        product: sampleProduct,
        buyCount: 1,
        price: sampleProduct.price,
        priceBeforeDiscount: sampleProduct.price_before_discount,
      })),
      subtotal,
      shippingFee: shippingMethod.price,
      discount,
      coinsDiscount,
      total: subtotal + shippingMethod.price - discount - coinsDiscount,
    }

    return HttpResponse.json(
      { message: 'Calculate successfully', data: summary },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

// Order Handlers
export const createOrderRequest = gated(
  'checkout',
  http.post(`${config.baseUrl}checkout/create-order`, async ({ request }) => {
    const rawBody = (await request.json()) as {
      purchase_ids: string[]
      shipping_address_id: string
      shipping_method_id: string
      payment_method: string
      voucher_code?: string
      coins_used?: number
      note?: string
    }
    const body: CreateOrderBody = {
      purchaseIds: rawBody.purchase_ids,
      shippingAddressId: rawBody.shipping_address_id,
      shippingMethodId: rawBody.shipping_method_id,
      paymentMethod: rawBody.payment_method as CreateOrderBody['paymentMethod'],
      voucherCode: rawBody.voucher_code,
      coinsUsed: rawBody.coins_used,
      note: rawBody.note,
    }
    const order = createMockOrder(
      body,
      `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
    )
    // GAP A: return fake client_secret so the credit-card branch in useCheckout fires
    const responseData = { ...order, client_secret: 'pi_mock_secret_xxx' }
    return HttpResponse.json(
      { message: 'Create order successfully', data: responseData },
      { status: HTTP_STATUS_CODE.Created },
    )
  }),
)

// GAP B: E-wallet initiation mock
export const initiatePaymentRequest = gated(
  'checkout',
  http.post(`${config.baseUrl}checkout/initiate-payment`, () => {
    const response: InitiatePaymentResponse = {
      sessionId: `session_mock_${Date.now()}`,
      payment_url: 'https://mock-payment.example.com/pay/session_mock',
    }
    return HttpResponse.json(
      { message: 'Initiate payment successfully', data: response },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

// GAP C: E-wallet session status mock
export const getSessionStatusRequest = gated(
  'checkout',
  http.get(`${config.baseUrl}checkout/session-status/:id`, () => {
    const response: PaymentSessionStatusResponse = {
      status: 'PAID',
      orderId: `order_mock_${Date.now()}`,
    }
    return HttpResponse.json(
      { message: 'Get session status successfully', data: response },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

const sampleOrders: Order[] = [
  // pending
  {
    _id: '65a1b2c3d4e5f6a7b8c9d0e1',
    userId: 'user1',
    items: [
      {
        product: sampleProduct,
        buyCount: 2,
        price: sampleProduct.price,
        priceBeforeDiscount: sampleProduct.price_before_discount,
      },
    ],
    shippingAddress: mockAddresses[0],
    shippingMethod: mockShippingMethods[2], // express
    paymentMethod: 'cod',
    subtotal: sampleProduct.price * 2,
    shippingFee: mockShippingMethods[2].price,
    discount: 50000,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: sampleProduct.price * 2 + mockShippingMethods[2].price - 50000,
    status: 'pending' as OrderStatus,
    createdAt: '2024-02-10T08:30:00.000Z',
    updatedAt: '2024-02-10T08:30:00.000Z',
  },
  {
    _id: '65a1b2c3d4e5f6a7b8c9d0e2',
    userId: 'user1',
    items: [
      {
        product: sampleProduct,
        buyCount: 1,
        price: sampleProduct.price,
        priceBeforeDiscount: sampleProduct.price_before_discount,
      },
    ],
    shippingAddress: mockAddresses[1],
    shippingMethod: mockShippingMethods[3], // economy
    paymentMethod: 'bank_transfer',
    subtotal: sampleProduct.price,
    shippingFee: mockShippingMethods[3].price,
    discount: 0,
    coinsUsed: 100,
    coinsDiscount: 10000,
    total: sampleProduct.price + mockShippingMethods[3].price - 10000,
    status: 'pending' as OrderStatus,
    createdAt: '2024-02-09T14:20:00.000Z',
    updatedAt: '2024-02-09T14:20:00.000Z',
  },
  // confirmed
  {
    _id: '65b2c3d4e5f6a7b8c9d0e1f2',
    userId: 'user1',
    items: [
      {
        product: sampleProduct,
        buyCount: 1,
        price: sampleProduct.price,
        priceBeforeDiscount: sampleProduct.price_before_discount,
      },
    ],
    shippingAddress: mockAddresses[2],
    shippingMethod: mockShippingMethods[0], // instant
    paymentMethod: 'cod',
    subtotal: sampleProduct.price,
    shippingFee: mockShippingMethods[0].price,
    discount: 30000,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: sampleProduct.price + mockShippingMethods[0].price - 30000,
    status: 'confirmed' as OrderStatus,
    createdAt: '2024-02-08T10:15:00.000Z',
    updatedAt: '2024-02-08T12:00:00.000Z',
  },
  // shipping
  {
    _id: '65c3d4e5f6a7b8c9d0e1f2a3',
    userId: 'user1',
    items: [
      {
        product: sampleProduct,
        buyCount: 1,
        price: sampleProduct.price,
        priceBeforeDiscount: sampleProduct.price_before_discount,
      },
    ],
    shippingAddress: mockAddresses[3],
    shippingMethod: mockShippingMethods[1], // bulky
    paymentMethod: 'cod',
    subtotal: sampleProduct.price,
    shippingFee: mockShippingMethods[1].price,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: sampleProduct.price + mockShippingMethods[1].price,
    status: 'shipping' as OrderStatus,
    createdAt: '2024-02-05T09:00:00.000Z',
    updatedAt: '2024-02-06T14:00:00.000Z',
  },
  // delivered
  {
    _id: '65d4e5f6a7b8c9d0e1f2a3b4',
    userId: 'user1',
    items: [
      {
        product: sampleProduct,
        buyCount: 1,
        price: sampleProduct.price,
        priceBeforeDiscount: sampleProduct.price_before_discount,
      },
    ],
    shippingAddress: mockAddresses[0],
    shippingMethod: mockShippingMethods[2],
    paymentMethod: 'cod',
    subtotal: sampleProduct.price,
    shippingFee: mockShippingMethods[2].price,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: sampleProduct.price + mockShippingMethods[2].price,
    status: 'delivered' as OrderStatus,
    createdAt: '2024-01-28T15:00:00.000Z',
    updatedAt: '2024-02-01T10:30:00.000Z',
  },
  {
    _id: '65d4e5f6a7b8c9d0e1f2a3b5',
    userId: 'user1',
    items: [
      {
        product: sampleProduct,
        buyCount: 3,
        price: sampleProduct.price,
        priceBeforeDiscount: sampleProduct.price_before_discount,
      },
    ],
    shippingAddress: mockAddresses[1],
    shippingMethod: mockShippingMethods[3],
    paymentMethod: 'bank_transfer',
    subtotal: sampleProduct.price * 3,
    shippingFee: 0,
    discount: 150000,
    coinsUsed: 300,
    coinsDiscount: 30000,
    total: sampleProduct.price * 3 - 150000 - 30000,
    status: 'delivered' as OrderStatus,
    createdAt: '2024-01-20T08:45:00.000Z',
    updatedAt: '2024-01-23T16:00:00.000Z',
  },
  // cancelled
  {
    _id: '65e5f6a7b8c9d0e1f2a3b4c5',
    userId: 'user1',
    items: [
      {
        product: sampleProduct,
        buyCount: 1,
        price: sampleProduct.price,
        priceBeforeDiscount: sampleProduct.price_before_discount,
      },
    ],
    shippingAddress: mockAddresses[4],
    shippingMethod: mockShippingMethods[4], // pickup
    paymentMethod: 'bank_transfer',
    subtotal: sampleProduct.price,
    shippingFee: mockShippingMethods[4].price,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: sampleProduct.price + mockShippingMethods[4].price,
    status: 'cancelled' as OrderStatus,
    note: 'Đổi ý không muốn mua nữa',
    createdAt: '2024-02-01T10:00:00.000Z',
    updatedAt: '2024-02-01T12:30:00.000Z',
  },
  // returned
  {
    _id: '65f6a7b8c9d0e1f2a3b4c5d6',
    userId: 'user1',
    items: [
      {
        product: sampleProduct,
        buyCount: 1,
        price: sampleProduct.price,
        priceBeforeDiscount: sampleProduct.price_before_discount,
      },
    ],
    shippingAddress: mockAddresses[0],
    shippingMethod: mockShippingMethods[3],
    paymentMethod: 'cod',
    subtotal: sampleProduct.price,
    shippingFee: mockShippingMethods[3].price,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: sampleProduct.price + mockShippingMethods[3].price,
    status: 'returned' as OrderStatus,
    note: 'Sản phẩm không đúng mô tả',
    createdAt: '2024-01-10T09:00:00.000Z',
    updatedAt: '2024-01-14T11:00:00.000Z',
  },
]

export const getOrdersRequest = gated(
  'orders',
  http.get(`${config.baseUrl}orders`, ({ request }) => {
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const limit = Math.max(1, Number(url.searchParams.get('limit')) || 10)
    const status = url.searchParams.get('status') || ''

    // Apply status filter — empty string or 'all' returns every order
    const filtered =
      status && status !== 'all' ? sampleOrders.filter((o) => o.status === status) : sampleOrders

    const total = filtered.length
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const orders = filtered.slice(startIndex, startIndex + limit)

    return HttpResponse.json(
      {
        message: 'Get orders successfully',
        data: {
          orders,
          pagination: { page, limit, total, totalPages },
        },
      },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

export const getOrderByIdRequest = gated(
  'orders',
  http.get(`${config.baseUrl}orders/:id`, ({ params }) => {
    const { id } = params
    const mockOrder = createMockOrder(
      {
        purchaseIds: [sampleProduct._id],
        shippingAddressId: '1',
        shippingMethodId: 'standard',
        paymentMethod: 'cod',
      },
      id as string,
    )
    return HttpResponse.json(
      { message: 'Get order successfully', data: mockOrder },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

export const cancelOrderRequest = gated(
  'orders',
  http.put(`${config.baseUrl}orders/:id/cancel`, async ({ params }) => {
    const { id } = params
    const cancelledOrder = createMockOrder(
      {
        purchaseIds: [sampleProduct._id],
        shippingAddressId: '1',
        shippingMethodId: 'standard',
        paymentMethod: 'cod',
      },
      id as string,
    )
    cancelledOrder.status = 'cancelled'
    return HttpResponse.json(
      { message: 'Cancel order successfully', data: cancelledOrder },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

// Error Handlers
export const createOrderErrorHandler = gated(
  'checkout',
  http.post(`${config.baseUrl}checkout/create-order`, () => {
    return HttpResponse.json(
      { message: 'Error creating order', data: { error: 'Internal Server Error' } },
      { status: HTTP_STATUS_CODE.InternalServerError },
    )
  }),
)

export const cancelOrderErrorHandler = gated(
  'orders',
  http.put(`${config.baseUrl}orders/:id/cancel`, () => {
    return HttpResponse.json(
      { message: 'Error cancelling order', data: { error: 'Internal Server Error' } },
      { status: HTTP_STATUS_CODE.InternalServerError },
    )
  }),
)

// Registration order:
// - All other literal 2-segment orders/* paths also before orders/:id
const checkoutRequests = [
  getShippingMethodsRequest,
  getPaymentMethodsRequest,
  calculateCheckoutRequest,
  createOrderRequest,
  initiatePaymentRequest,
  getSessionStatusRequest,
  getOrdersRequest,
  getOrderByIdRequest,
  cancelOrderRequest,
]

export default checkoutRequests
