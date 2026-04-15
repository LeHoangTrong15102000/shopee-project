import { http, HttpResponse } from 'msw'
import { mockUsers } from './data/users.mock'
import { API_URL } from './msw-utils'

const settingsHandlers = [
  http.get(`${API_URL}/me`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockUsers[0] })
  }),

  http.put(`${API_URL}/me`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      message: 'Cập nhật thông tin thành công',
      data: { ...mockUsers[0], ...body },
    })
  }),
]

export default settingsHandlers
