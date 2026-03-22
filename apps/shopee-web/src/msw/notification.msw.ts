import { http, HttpResponse } from 'msw';
import config from 'src/constant/config';
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum';

const sampleNotifications = [
  {
    _id: 'notif-1',
    type: 'order',
    title: 'Order confirmed',
    message: 'Order #order-1 has been confirmed and is being processed',
    is_read: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'notif-2',
    type: 'promotion',
    title: 'Special promotion',
    message: '50% off for your first order',
    is_read: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

const getNotificationsRequest = http.get(`${config.baseUrl}notifications`, () => {
  return HttpResponse.json(
    { message: 'Lấy thông báo thành công', data: sampleNotifications },
    { status: HTTP_STATUS_CODE.Ok },
  );
});

const markNotificationReadRequest = http.put(`${config.baseUrl}notifications/:id/read`, () => {
  return HttpResponse.json(
    { message: 'Đánh dấu đã đọc thành công', data: { ...sampleNotifications[0], is_read: true } },
    { status: HTTP_STATUS_CODE.Ok },
  );
});

const markAllNotificationsReadRequest = http.put(`${config.baseUrl}notifications/read-all`, () => {
  return HttpResponse.json(
    { message: 'Đánh dấu tất cả đã đọc thành công', data: { modified_count: 2 } },
    { status: HTTP_STATUS_CODE.Ok },
  );
});

const notificationRequests = [
  getNotificationsRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest,
];

export default notificationRequests;
