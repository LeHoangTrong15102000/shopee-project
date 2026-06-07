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
          image: 'https://picsum.photos/200',
        },
        buyCount: 2,
        price: 250000,
        priceBeforeDiscount: 350000,
      },
    ],
    subtotal: 500000,
    shippingFee: 30000,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    total: 530000,
    status: 'pending',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]

const getOrdersRequest = http.get(`${config.baseUrl}purchases`, () => {
  return HttpResponse.json(
    { message: 'Lấy danh sách đơn hàng thành công', data: sampleOrders },
    { status: HTTP_STATUS_CODE.Ok },
  )
})

const getOrderDetailRequest = http.get(`${config.baseUrl}orders/:id`, ({ params }) => {
  const order = sampleOrders.find((o) => o._id === params.id) || {
    ...sampleOrders[0],
    _id: params.id,
  }
  return HttpResponse.json(
    { message: 'Lấy chi tiết đơn hàng thành công', data: order },
    { status: HTTP_STATUS_CODE.Ok },
  )
})

const cancelOrderRequest = http.put(`${config.baseUrl}orders/:id/cancel`, () => {
  return HttpResponse.json(
    { message: 'Hủy đơn hàng thành công', data: { ...sampleOrders[0], status: 'cancelled' } },
    { status: HTTP_STATUS_CODE.Ok },
  )
})

const getOrderTrackingRequest = http.get(`${config.baseUrl}orders/tracking`, ({ request }) => {
  const url = new URL(request.url)
  const orderId = url.searchParams.get('order_id') || 'order-1'
  const statusParam = url.searchParams.get('status')
  const validStatuses = [
    'pending',
    'confirmed',
    'processing',
    'shipping',
    'delivered',
    'cancelled',
    'returned',
  ]
  const status = validStatuses.includes(statusParam ?? '') ? statusParam : 'shipping'

  const trackingData = {
    _id: `tracking-${orderId}`,
    order_id: orderId,
    user_id: 'user-1',
    tracking_number: 'VN2024SHOP001',
    carrier: 'ghn',
    status,
    estimated_delivery: '2024-01-10T00:00:00.000Z',
    timeline: [
      {
        status: 'pending',
        description: 'Đơn hàng đã được đặt thành công',
        location: 'Hà Nội',
        timestamp: '2024-01-01T08:00:00.000Z',
      },
      {
        status: 'confirmed',
        description: 'Đơn hàng đã được xác nhận bởi người bán',
        location: 'Hà Nội',
        timestamp: '2024-01-01T10:30:00.000Z',
      },
      {
        status: 'processing',
        description: 'Đơn hàng đang được đóng gói và chuẩn bị giao cho đơn vị vận chuyển',
        location: 'Kho GHN - Hà Nội',
        timestamp: '2024-01-02T09:00:00.000Z',
      },
      {
        status: 'shipping',
        description: 'Đơn hàng đang trên đường giao đến bạn',
        location: 'Trung tâm phân loại GHN - TP.HCM',
        timestamp: '2024-01-03T14:00:00.000Z',
      },
    ],
    shipping_address: {
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      address: '123 Đường Lê Lợi',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
    },
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-03T14:00:00.000Z',
  }

  return HttpResponse.json(
    { message: 'Lấy thông tin vận chuyển thành công', data: trackingData },
    { status: HTTP_STATUS_CODE.Ok },
  )
})

const orderRequests = [
  getOrdersRequest,
  getOrderTrackingRequest,
  getOrderDetailRequest,
  cancelOrderRequest,
]

export default orderRequests
