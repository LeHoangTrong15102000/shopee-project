import { http, HttpResponse } from 'msw'
import config from 'src/constant/config'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'

const sampleProduct = {
  _id: '60afb2426ef5b902180aacb9',
  name: 'Điện thoại OPPO A12 (3GB/32GB) - Hàng chính hãng',
  price: 2590000,
  price_before_discount: 3490000,
  image: 'https://api-ecom.duthanhduoc.com/images/aa374023-7a5b-46ea-aca3-dad1b29fb015.jpg',
  quantity: 73,
  images: [
    'https://api-ecom.duthanhduoc.com/images/aa374023-7a5b-46ea-aca3-dad1b29fb015.jpg',
    'https://api-ecom.duthanhduoc.com/images/b997dac2-2674-4e20-b5ee-459566b077e7.jpg'
  ],
  rating: 4.2,
  sold: 6800,
  view: 3359,
  category: {
    _id: '60afafe76ef5b902180aacb5',
    name: 'Điện thoại'
  },
  description: 'Điện thoại OPPO A12 chính hãng',
  createdAt: '2021-05-27T14:52:50.392Z',
  updatedAt: '2022-12-19T15:19:53.312Z'
}

const samplePurchases = [
  {
    _id: '65a1b2c3d4e5f6a7b8c9d0e1',
    buy_count: 2,
    price: 2590000,
    price_before_discount: 3490000,
    status: -1,
    user: '63e0f0386d7c620340850e6e',
    product: sampleProduct,
    createdAt: '2024-01-12T10:30:00.000Z',
    updatedAt: '2024-01-12T10:30:00.000Z'
  },
  {
    _id: '65a1b2c3d4e5f6a7b8c9d0e2',
    buy_count: 1,
    price: 75000,
    price_before_discount: 150000,
    status: -1,
    user: '63e0f0386d7c620340850e6e',
    product: {
      ...sampleProduct,
      _id: '60af6f12f1a3041b289d8b9b',
      name: 'Áo thun Polo nam cổ bẻ BASIC vải cá sấu Cotton',
      price: 75000,
      price_before_discount: 150000,
      image: 'https://api-ecom.duthanhduoc.com/images/b18506cc-3d5f-4160-aee3-8e4242ed5717.jpg'
    },
    createdAt: '2024-01-12T11:00:00.000Z',
    updatedAt: '2024-01-12T11:00:00.000Z'
  }
]

const shippingMethods = [
  {
    _id: 'shipping_standard',
    name: 'Giao hàng tiêu chuẩn',
    price: 30000,
    estimatedDays: '3-5 ngày',
    description: 'Giao hàng trong 3-5 ngày làm việc',
    icon: 'truck'
  },
  {
    _id: 'shipping_express',
    name: 'Giao hàng nhanh',
    price: 50000,
    estimatedDays: '1-2 ngày',
    description: 'Giao hàng trong 1-2 ngày làm việc',
    icon: 'rocket'
  },
  {
    _id: 'shipping_same_day',
    name: 'Giao hàng trong ngày',
    price: 80000,
    estimatedDays: 'Trong ngày',
    description: 'Nhận hàng trong ngày (đặt trước 12h)',
    icon: 'lightning'
  }
]

const paymentMethods = [
  { _id: 'cod', name: 'Thanh toán khi nhận hàng', description: 'Thanh toán bằng tiền mặt khi nhận hàng' },
  { _id: 'bank_transfer', name: 'Chuyển khoản ngân hàng', description: 'Chuyển khoản qua tài khoản ngân hàng' },
  { _id: 'e_wallet', name: 'Ví điện tử', description: 'Thanh toán qua MoMo, ZaloPay, VNPay' },
  { _id: 'credit_card', name: 'Thẻ tín dụng/ghi nợ', description: 'Thanh toán qua Visa, Mastercard, JCB' }
]

// Success handlers
export const addToCartRequest = http.post(`${config.baseUrl}purchases/add-to-cart`, async ({ request }) => {
  const body = (await request.json()) as { product_id: string; buy_count: number }
  const newPurchase = {
    _id: `purchase_${Date.now()}`,
    buy_count: body.buy_count,
    price: sampleProduct.price,
    price_before_discount: sampleProduct.price_before_discount,
    status: -1,
    user: '63e0f0386d7c620340850e6e',
    product: sampleProduct,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  return HttpResponse.json(
    { message: 'Thêm sản phẩm vào giỏ hàng thành công', data: newPurchase },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

export const getPurchasesRequest = http.get(`${config.baseUrl}purchases`, () => {
  return HttpResponse.json(
    { message: 'Lấy đơn mua thành công', data: samplePurchases },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

export const updatePurchaseRequest = http.put(`${config.baseUrl}purchases/update-purchase`, async ({ request }) => {
  const body = (await request.json()) as { product_id: string; buy_count: number }
  const updatedPurchase = { ...samplePurchases[0], buy_count: body.buy_count, updatedAt: new Date().toISOString() }
  return HttpResponse.json(
    { message: 'Cập nhật đơn thành công', data: updatedPurchase },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

export const deletePurchasesRequest = http.delete(`${config.baseUrl}purchases`, () => {
  return HttpResponse.json(
    { message: 'Xoá đơn thành công', data: { deleted_count: 1 } },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

export const createOrderRequest = http.post(`${config.baseUrl}orders`, async ({ request }) => {
  const body = (await request.json()) as { purchase_ids: string[]; shipping_method: string; payment_method: string }
  const order = {
    _id: `order_${Date.now()}`,
    purchases: samplePurchases.filter((p) => body.purchase_ids?.includes(p._id)),
    shipping_method: body.shipping_method,
    payment_method: body.payment_method,
    status: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  return HttpResponse.json({ message: 'Đặt hàng thành công', data: order }, { status: HTTP_STATUS_CODE.Created })
})

export const getShippingMethodsRequest = http.get(`${config.baseUrl}shipping/methods`, () => {
  return HttpResponse.json(
    { message: 'Lấy phương thức vận chuyển thành công', data: shippingMethods },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

export const getPaymentMethodsRequest = http.get(`${config.baseUrl}payment/methods`, () => {
  return HttpResponse.json(
    { message: 'Lấy phương thức thanh toán thành công', data: paymentMethods },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

// Error handlers for testing error scenarios
export const addToCartErrorHandler = http.post(`${config.baseUrl}purchases/add-to-cart`, () => {
  return HttpResponse.json(
    { message: 'Lỗi khi thêm sản phẩm vào giỏ hàng', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError }
  )
})

export const updatePurchaseErrorHandler = http.put(`${config.baseUrl}purchases/update-purchase`, () => {
  return HttpResponse.json(
    { message: 'Lỗi khi cập nhật đơn hàng', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError }
  )
})

export const deletePurchaseErrorHandler = http.delete(`${config.baseUrl}purchases`, () => {
  return HttpResponse.json(
    { message: 'Lỗi khi xoá đơn hàng', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError }
  )
})

export const createOrderErrorHandler = http.post(`${config.baseUrl}orders`, () => {
  return HttpResponse.json(
    { message: 'Lỗi khi đặt hàng', data: { error: 'Internal Server Error' } },
    { status: HTTP_STATUS_CODE.InternalServerError }
  )
})

const cartRequests = [
  addToCartRequest,
  getPurchasesRequest,
  updatePurchaseRequest,
  deletePurchasesRequest,
  createOrderRequest,
  getShippingMethodsRequest,
  getPaymentMethodsRequest
]

export default cartRequests
