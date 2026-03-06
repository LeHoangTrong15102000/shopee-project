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
  CheckoutSummary
} from 'src/types/checkout.type'

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
    updatedAt: '2024-01-01T00:00:00.000Z'
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
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
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
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
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
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
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
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
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
  updatedAt: '2022-12-19T15:19:53.312Z'
}

const createMockOrder = (body: CreateOrderBody, id: string): Order => {
  const shippingMethod = mockShippingMethods.find((m) => m._id === body.shippingMethodId) || mockShippingMethods[0]
  const shippingAddress = mockAddresses.find((a) => a._id === body.shippingAddressId) || mockAddresses[0]
  const subtotal = body.purchaseIds.length * sampleProduct.price

  return {
    _id: id,
    userId: 'user1',
    items: body.purchaseIds.map(() => ({
      product: sampleProduct,
      buyCount: 1,
      price: sampleProduct.price,
      priceBeforeDiscount: sampleProduct.price_before_discount
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
    updatedAt: new Date().toISOString()
  }
}

// Shipping Methods Handlers
export const getShippingMethodsRequest = http.get(`${config.baseUrl}orders/shipping/methods`, () => {
  return HttpResponse.json(
    { message: 'Lấy phương thức vận chuyển thành công', data: mockShippingMethods },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

// Payment Methods Handlers
export const getPaymentMethodsRequest = http.get(`${config.baseUrl}orders/payment/methods`, () => {
  return HttpResponse.json(
    { message: 'Lấy phương thức thanh toán thành công', data: mockPaymentMethods },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

// Checkout Calculate Handler
export const calculateCheckoutRequest = http.post(`${config.baseUrl}checkout/summary`, async ({ request }) => {
  const rawBody = (await request.json()) as {
    purchase_ids: string[]
    shipping_method_id?: string
    voucher_code?: string
    coins_used?: number
  }
  const shippingMethod = mockShippingMethods.find((m) => m._id === rawBody.shipping_method_id) || mockShippingMethods[0]
  const subtotal = rawBody.purchase_ids.length * sampleProduct.price
  const coinsDiscount = rawBody.coins_used || 0

  const summary: CheckoutSummary = {
    items: rawBody.purchase_ids.map(() => ({
      product: sampleProduct,
      buyCount: 1,
      price: sampleProduct.price,
      priceBeforeDiscount: sampleProduct.price_before_discount
    })),
    subtotal,
    shippingFee: shippingMethod.price,
    discount: 0,
    coinsDiscount,
    total: subtotal + shippingMethod.price - coinsDiscount
  }

  return HttpResponse.json({ message: 'Tính toán thành công', data: summary }, { status: HTTP_STATUS_CODE.Ok })
})

// Order Handlers
export const createOrderRequest = http.post(`${config.baseUrl}checkout/create-order`, async ({ request }) => {
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
    note: rawBody.note
  }
  const order = createMockOrder(body, `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`)
  return HttpResponse.json({ message: 'Đặt hàng thành công', data: order }, { status: HTTP_STATUS_CODE.Created })
})

export const getOrdersRequest = http.get(`${config.baseUrl}orders`, ({ request }) => {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1
  const limit = Number(url.searchParams.get('limit')) || 10

  return HttpResponse.json(
    {
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      }
    },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

export const getOrderByIdRequest = http.get(`${config.baseUrl}orders/:id`, ({ params }) => {
  const { id } = params
  const mockOrder = createMockOrder(
    {
      purchaseIds: [sampleProduct._id],
      shippingAddressId: '1',
      shippingMethodId: 'standard',
      paymentMethod: 'cod'
    },
    id as string
  )
  return HttpResponse.json({ message: 'Lấy đơn hàng thành công', data: mockOrder }, { status: HTTP_STATUS_CODE.Ok })
})

export const cancelOrderRequest = http.put(`${config.baseUrl}orders/:id/cancel`, async ({ params }) => {
  const { id } = params
  const cancelledOrder = createMockOrder(
    {
      purchaseIds: [sampleProduct._id],
      shippingAddressId: '1',
      shippingMethodId: 'standard',
      paymentMethod: 'cod'
    },
    id as string
  )
  cancelledOrder.status = 'cancelled'
  return HttpResponse.json(
    { message: 'Hủy đơn hàng thành công', data: cancelledOrder },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

// Address Handlers
export const getAddressesRequest = http.get(`${config.baseUrl}addresses`, () => {
  return HttpResponse.json(
    {
      message: 'Lấy danh sách địa chỉ thành công',
      data: { addresses: mockAddresses, total: mockAddresses.length }
    },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

export const getAddressByIdRequest = http.get(`${config.baseUrl}addresses/:id`, ({ params }) => {
  const { id } = params
  const address = mockAddresses.find((a) => a._id === id) || mockAddresses[0]
  return HttpResponse.json({ message: 'Lấy địa chỉ thành công', data: address }, { status: HTTP_STATUS_CODE.Ok })
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
    updatedAt: new Date().toISOString()
  }
  return HttpResponse.json(
    { message: 'Tạo địa chỉ thành công', data: newAddress },
    { status: HTTP_STATUS_CODE.Created }
  )
})

export const updateAddressRequest = http.put(`${config.baseUrl}addresses/:id`, async ({ params, request }) => {
  const { id } = params
  const body = (await request.json()) as Partial<AddressFormData>
  const existingAddress = mockAddresses.find((a) => a._id === id) || mockAddresses[0]
  const updatedAddress: Address = {
    ...existingAddress,
    ...body,
    updatedAt: new Date().toISOString()
  }
  return HttpResponse.json(
    { message: 'Cập nhật địa chỉ thành công', data: updatedAddress },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

export const deleteAddressRequest = http.delete(`${config.baseUrl}addresses/:id`, () => {
  return HttpResponse.json(
    { message: 'Xóa địa chỉ thành công', data: { message: 'Xóa địa chỉ thành công' } },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

export const setDefaultAddressRequest = http.put(`${config.baseUrl}addresses/:id/default`, ({ params }) => {
  const { id } = params
  const address = mockAddresses.find((a) => a._id === id) || mockAddresses[0]
  const updatedAddress: Address = {
    ...address,
    isDefault: true,
    updatedAt: new Date().toISOString()
  }
  return HttpResponse.json(
    { message: 'Đặt địa chỉ mặc định thành công', data: updatedAddress },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

// Error Handlers
export const createOrderErrorHandler = http.post(`${config.baseUrl}checkout/create-order`, () => {
  return HttpResponse.json(
    { message: 'Lỗi khi đặt hàng', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError }
  )
})

export const cancelOrderErrorHandler = http.put(`${config.baseUrl}orders/:id/cancel`, () => {
  return HttpResponse.json(
    { message: 'Lỗi khi hủy đơn hàng', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError }
  )
})

export const createAddressErrorHandler = http.post(`${config.baseUrl}addresses`, () => {
  return HttpResponse.json(
    { message: 'Lỗi khi tạo địa chỉ', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError }
  )
})

export const deleteAddressErrorHandler = http.delete(`${config.baseUrl}addresses/:id`, () => {
  return HttpResponse.json(
    { message: 'Lỗi khi xóa địa chỉ', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError }
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
  setDefaultAddressRequest
]

export default checkoutRequests
