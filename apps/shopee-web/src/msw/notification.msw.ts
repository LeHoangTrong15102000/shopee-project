import { http, HttpResponse } from 'msw'
import config from 'src/constant/config'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'
import { gated } from 'src/mocks/mockControl'

// Backend-shaped notifications. The frontend transform layer
// (transformNotificationResponse) reads data.notifications[*] with fields
// _id, title, content, type, is_read ?? isRead, link, createdAt, updatedAt and
// pagination.total_pages plus unread_count ?? unreadCount. This mock mirrors
// that contract exactly so the response survives the transform.
const sampleNotifications = [
  {
    _id: '1',
    title: 'Đơn hàng của bạn đã được xác nhận',
    content:
      'Đơn hàng #SP123456 đã được xác nhận và đang được chuẩn bị. Dự kiến giao hàng trong 2-3 ngày.',
    type: 'order',
    isRead: false,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    updatedAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    _id: '2',
    title: 'Flash Sale 12.12 - Giảm giá đến 50%',
    content:
      'Sự kiện Flash Sale 12.12 đã bắt đầu! Hàng ngàn sản phẩm giảm giá đến 50%. Mua ngay kẻo lỡ!',
    type: 'promotion',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: '3',
    title: 'Cập nhật chính sách bảo mật',
    content:
      'Chúng tôi đã cập nhật chính sách bảo mật để bảo vệ thông tin của bạn tốt hơn. Vui lòng xem chi tiết.',
    type: 'system',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: '4',
    title: 'Voucher miễn phí vận chuyển',
    content: 'Bạn có 1 voucher miễn phí vận chuyển cho đơn hàng từ 100k. Áp dụng đến hết ngày mai.',
    type: 'promotion',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: '5',
    title: 'Đánh giá sản phẩm và nhận xu',
    content:
      'Đánh giá sản phẩm bạn đã mua để nhận xu ShopHub. Xu có thể dùng để mua sắm tiếp theo.',
    type: 'other',
    isRead: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
]

const unreadCount = sampleNotifications.filter((n) => !n.isRead).length

const getNotificationsRequest = gated(
  'notification',
  http.get(`${config.baseUrl}notifications`, () => {
    return HttpResponse.json(
      {
        message: 'Lấy danh sách thông báo thành công',
        data: {
          notifications: sampleNotifications,
          pagination: {
            page: 1,
            limit: 10,
            total: sampleNotifications.length,
            total_pages: 1,
          },
          unreadCount,
        },
      },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

const getUnreadCountRequest = gated(
  'notification',
  http.get(`${config.baseUrl}notifications/unread-count`, () => {
    return HttpResponse.json(
      { message: 'Lấy số thông báo chưa đọc thành công', data: { unreadCount } },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

const markNotificationReadRequest = gated(
  'notification',
  http.put(`${config.baseUrl}notifications/:id/read`, ({ params }) => {
    const { id } = params
    const target = sampleNotifications.find((n) => n._id === id) || sampleNotifications[0]
    return HttpResponse.json(
      { message: 'Đánh dấu đã đọc thành công', data: { ...target, isRead: true } },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

const markAllNotificationsReadRequest = gated(
  'notification',
  http.put(`${config.baseUrl}notifications/read-all`, () => {
    return HttpResponse.json(
      {
        message: 'Đánh dấu tất cả đã đọc thành công',
        data: { message: 'Đánh dấu tất cả đã đọc thành công' },
      },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

const deleteNotificationRequest = gated(
  'notification',
  http.delete(`${config.baseUrl}notifications/:id`, () => {
    return HttpResponse.json(
      { message: 'Xoá thông báo thành công', data: { message: 'Xoá thông báo thành công' } },
      { status: HTTP_STATUS_CODE.Ok },
    )
  }),
)

const notificationRequests = [
  getNotificationsRequest,
  getUnreadCountRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest,
  deleteNotificationRequest,
]

export default notificationRequests
