import { http, HttpResponse } from 'msw'
import config from 'src/constant/config'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'

const sampleOrders = [
  {
    _id: 'order-1',
    userId: 'user-1',
    items: [
      {
        product: {
          _id: 'prod-1',
          name: 'Áo thun nam',
          price: 250000,
          price_before_discount: 350000,
          image: 'https://picsum.photos/200'
        },
        buyCount: 2,
        price: 250000,
        priceBeforeDiscount: 350000
      }
    ],
    subtotal: 500000,
    shippingFee: 30000,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: 530000,
    status: 'pending',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

const getOrdersRequest = http.get(`${config.baseUrl}orders`, () => {
  return HttpResponse.json(
    { message: 'Lấy danh sách đơn hàng thành công', data: sampleOrders },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

const getOrderDetailRequest = http.get(`${config.baseUrl}orders/:id`, ({ params }) => {
  const order = sampleOrders.find((o) => o._id === params.id) || { ...sampleOrders[0], _id: params.id }
  return HttpResponse.json(
    { message: 'Lấy chi tiết đơn hàng thành công', data: order },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

const cancelOrderRequest = http.put(`${config.baseUrl}orders/:id/cancel`, () => {
  return HttpResponse.json(
    { message: 'Hủy đơn hàng thành công', data: { ...sampleOrders[0], status: 'cancelled' } },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

const orderRequests = [getOrdersRequest, getOrderDetailRequest, cancelOrderRequest]

export default orderRequests
