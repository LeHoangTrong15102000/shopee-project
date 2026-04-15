import { createMockNotification } from 'src/test-utils/factories'
import type { Notification } from 'src/types'

export const mockNotifications: Notification[] = [
  createMockNotification({
    _id: 'notif-1',
    title: 'Đơn hàng mới',
    message: 'Có đơn hàng mới cần xử lý',
    type: 'broadcast',
    is_read: false,
  }),
  createMockNotification({
    _id: 'notif-2',
    title: 'Sản phẩm hết hàng',
    message: 'iPhone 15 đã hết hàng',
    type: 'targeted',
    is_read: false,
  }),
  createMockNotification({
    _id: 'notif-3',
    title: 'Đánh giá mới',
    message: 'Có đánh giá mới cho sản phẩm',
    type: 'broadcast',
    is_read: true,
  }),
  createMockNotification({
    _id: 'notif-4',
    title: 'Khuyến mãi sắp hết',
    message: 'Voucher SALE50 sắp hết hạn',
    type: 'targeted',
    is_read: true,
  }),
]
