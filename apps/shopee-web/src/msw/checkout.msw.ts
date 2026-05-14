import { http, HttpResponse } from 'msw'
import config from 'src/constant/config'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'
import {
  Address,
  AddressFormData,
  ShippingMethod,
  PaymentMethod,
  Order,
  OrderStatus,
  CreateOrderBody,
  CheckoutSummary,
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

const mockAddresses: Address[] = [
  {
    _id: '1',
    userId: 'user1',
    fullName: 'John Doe',
    phone: '0901234567',
    province: 'Ho Chi Minh',
    district: 'District 1',
    ward: 'Ben Nghe Ward',
    street: '123 Le Loi Street',
    addressType: 'home',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '2',
    userId: 'user1',
    fullName: 'John Doe',
    phone: '0909876543',
    province: 'Ho Chi Minh',
    district: 'District 7',
    ward: 'Tan Phu Ward',
    street: '456 Nguyen Van Linh Street',
    addressType: 'home',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '3',
    userId: 'user1',
    fullName: 'Jane Smith',
    phone: '0912345678',
    province: 'Hanoi',
    district: 'Cau Giay District',
    ward: 'Dich Vong Ward',
    street: '789 Xuan Thuy Street',
    addressType: 'office',
    label: 'Company Office',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '4',
    userId: 'user1',
    fullName: 'Mike Johnson',
    phone: '0923456789',
    province: 'Da Nang',
    district: 'Hai Chau District',
    ward: 'Thach Thang Ward',
    street: '321 Nguyen Van Linh Street',
    addressType: 'home',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '5',
    userId: 'user1',
    fullName: 'Sarah Williams',
    phone: '0934567890',
    province: 'Can Tho',
    district: 'Ninh Kieu District',
    ward: 'An Hoa Ward',
    street: '654 April 30th Street',
    addressType: 'other',
    label: "Grandmother's House",
    isDefault: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
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
export const getShippingMethodsRequest = http.get(
  `${config.baseUrl}orders/shipping/methods`,
  () => {
    return HttpResponse.json(
      { message: 'Get shipping methods successfully', data: mockShippingMethods },
      { status: HTTP_STATUS_CODE.Ok },
    )
  },
)

// Payment Methods Handlers
export const getPaymentMethodsRequest = http.get(`${config.baseUrl}orders/payment/methods`, () => {
  return HttpResponse.json(
    { message: 'Get payment methods successfully', data: mockPaymentMethods },
    { status: HTTP_STATUS_CODE.Ok },
  )
})

// Checkout Calculate Handler
export const calculateCheckoutRequest = http.post(
  `${config.baseUrl}checkout/summary`,
  async ({ request }) => {
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
      return HttpResponse.json(
        { message: 'Invalid voucher code' },
        { status: 400 },
      )
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
  },
)

// Order Handlers
export const createOrderRequest = http.post(
  `${config.baseUrl}checkout/create-order`,
  async ({ request }) => {
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
    return HttpResponse.json(
      { message: 'Create order successfully', data: order },
      { status: HTTP_STATUS_CODE.Created },
    )
  },
)

export const getOrdersRequest = http.get(`${config.baseUrl}orders`, ({ request }) => {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1
  const limit = Number(url.searchParams.get('limit')) || 10

  return HttpResponse.json(
    {
      message: 'Get orders successfully',
      data: {
        orders: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      },
    },
    { status: HTTP_STATUS_CODE.Ok },
  )
})

export const getOrderByIdRequest = http.get(`${config.baseUrl}orders/:id`, ({ params }) => {
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
})

export const cancelOrderRequest = http.put(
  `${config.baseUrl}orders/:id/cancel`,
  async ({ params }) => {
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
  },
)

// Address Handlers
export const getAddressesRequest = http.get(`${config.baseUrl}addresses`, () => {
  return HttpResponse.json(
    {
      message: 'Get addresses successfully',
      data: { addresses: mockAddresses, total: mockAddresses.length },
    },
    { status: HTTP_STATUS_CODE.Ok },
  )
})

export const getAddressByIdRequest = http.get(`${config.baseUrl}addresses/:id`, ({ params }) => {
  const { id } = params
  const address = mockAddresses.find((a) => a._id === id) || mockAddresses[0]
  return HttpResponse.json(
    { message: 'Get address successfully', data: address },
    { status: HTTP_STATUS_CODE.Ok },
  )
})

export const createAddressRequest = http.post(`${config.baseUrl}addresses`, async ({ request }) => {
  const body = (await request.json()) as AddressFormData
  const newAddress: Address = {
    _id: `address_${Date.now()}`,
    userId: 'user1',
    fullName: body.fullName,
    phone: body.phone,
    province: body.province,
    district: body.district,
    ward: body.ward,
    street: body.street,
    isDefault: body.isDefault || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return HttpResponse.json(
    { message: 'Create address successfully', data: newAddress },
    { status: HTTP_STATUS_CODE.Created },
  )
})

export const updateAddressRequest = http.put(
  `${config.baseUrl}addresses/:id`,
  async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as Partial<AddressFormData>
    const existingAddress = mockAddresses.find((a) => a._id === id) || mockAddresses[0]
    const updatedAddress: Address = {
      ...existingAddress,
      ...body,
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json(
      { message: 'Update address successfully', data: updatedAddress },
      { status: HTTP_STATUS_CODE.Ok },
    )
  },
)

export const deleteAddressRequest = http.delete(`${config.baseUrl}addresses/:id`, () => {
  return HttpResponse.json(
    { message: 'Delete address successfully', data: { message: 'Delete address successfully' } },
    { status: HTTP_STATUS_CODE.Ok },
  )
})

export const setDefaultAddressRequest = http.put(
  `${config.baseUrl}addresses/:id/default`,
  ({ params }) => {
    const { id } = params
    const address = mockAddresses.find((a) => a._id === id) || mockAddresses[0]
    const updatedAddress: Address = {
      ...address,
      isDefault: true,
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json(
      { message: 'Set default address successfully', data: updatedAddress },
      { status: HTTP_STATUS_CODE.Ok },
    )
  },
)

// Error Handlers
export const createOrderErrorHandler = http.post(`${config.baseUrl}checkout/create-order`, () => {
  return HttpResponse.json(
    { message: 'Error creating order', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError },
  )
})

export const cancelOrderErrorHandler = http.put(`${config.baseUrl}orders/:id/cancel`, () => {
  return HttpResponse.json(
    { message: 'Error cancelling order', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError },
  )
})

export const createAddressErrorHandler = http.post(`${config.baseUrl}addresses`, () => {
  return HttpResponse.json(
    { message: 'Error creating address', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError },
  )
})

export const deleteAddressErrorHandler = http.delete(`${config.baseUrl}addresses/:id`, () => {
  return HttpResponse.json(
    { message: 'Error deleting address', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError },
  )
})

const checkoutRequests = [
  getShippingMethodsRequest,
  getPaymentMethodsRequest,
  calculateCheckoutRequest,
  createOrderRequest,
  getOrdersRequest,
  getOrderByIdRequest,
  cancelOrderRequest,
  getAddressesRequest,
  getAddressByIdRequest,
  createAddressRequest,
  updateAddressRequest,
  deleteAddressRequest,
  setDefaultAddressRequest,
]

export default checkoutRequests
