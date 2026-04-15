import { http, HttpResponse } from 'msw'
import { mockUsers } from './data/users.mock'
import { API_URL } from './msw-utils'

const usersHandlers = [
  http.get(`${API_URL}/admin/users`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '10')
    const start = (page - 1) * limit
    const paginated = mockUsers.slice(start, start + limit)
    return HttpResponse.json({
      message: 'Lấy danh sách người dùng thành công',
      data: {
        items: paginated,
        pagination: {
          page,
          limit,
          page_size: Math.ceil(mockUsers.length / limit) || 1,
          total: mockUsers.length,
        },
      },
    })
  }),

  http.get(`${API_URL}/admin/users/:id`, ({ params }) => {
    const user = mockUsers.find((u) => u._id === params.id)
    if (!user) {
      return HttpResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Thành công', data: user })
  }),

  http.post(`${API_URL}/admin/users`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newUser = { ...mockUsers[1], ...body, _id: `user-new-${Date.now()}` }
    return HttpResponse.json(
      { message: 'Tạo người dùng thành công', data: newUser },
      { status: 201 },
    )
  }),

  http.put(`${API_URL}/admin/users/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const user = mockUsers.find((u) => u._id === params.id)
    if (!user) {
      return HttpResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Cập nhật thành công', data: { ...user, ...body } })
  }),

  http.delete(`${API_URL}/admin/users/delete/:id`, () => {
    return HttpResponse.json({ message: 'Xóa người dùng thành công', data: null })
  }),
]

export default usersHandlers
