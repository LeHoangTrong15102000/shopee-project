import { http, HttpResponse } from 'msw'
import { mockNotifications } from './data/notifications.mock'
import { API_URL } from './msw-utils'

const notificationsHandlers = [
  http.get(`${API_URL}/admin/notifications`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '10')
    const start = (page - 1) * limit
    const paginated = mockNotifications.slice(start, start + limit)
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        notifications: paginated,
        pagination: {
          page,
          limit,
          total: mockNotifications.length,
          totalPages: Math.ceil(mockNotifications.length / limit) || 1,
        },
      },
    })
  }),

  http.post(`${API_URL}/admin/notifications`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newNotif = { ...mockNotifications[0], ...body, _id: `notif-new-${Date.now()}` }
    return HttpResponse.json(
      { message: 'Tạo thông báo thành công', data: newNotif },
      { status: 201 },
    )
  }),

  http.post(`${API_URL}/admin/notifications/broadcast`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newNotif = {
      ...mockNotifications[0],
      ...body,
      _id: `notif-broadcast-${Date.now()}`,
      type: 'broadcast',
    }
    return HttpResponse.json(
      { message: 'Gửi thông báo broadcast thành công', data: newNotif },
      { status: 201 },
    )
  }),

  http.delete(`${API_URL}/admin/notifications/:id`, () => {
    return HttpResponse.json({ message: 'Xóa thông báo thành công', data: null })
  }),

  http.put(`${API_URL}/admin/notifications/:id/read`, ({ params }) => {
    const notif = mockNotifications.find((n) => n._id === params.id)
    return HttpResponse.json({
      message: 'Đánh dấu đã đọc thành công',
      data: notif ? { ...notif, is_read: true } : null,
    })
  }),
]

export default notificationsHandlers
