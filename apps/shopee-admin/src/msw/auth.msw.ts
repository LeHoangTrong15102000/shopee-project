import { http, HttpResponse } from 'msw'
import { mockUsers } from './data/users.mock'
import { API_URL } from './msw-utils'

const MOCK_CREDENTIALS = { email: 'admin@shopee.com', password: 'admin123' }

const authHandlers = [
  http.post(`${API_URL}/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    const user = mockUsers.find((u) => u.email === body.email)
    if (!user || body.password !== MOCK_CREDENTIALS.password) {
      return HttpResponse.json({ message: 'Email hoặc mật khẩu không đúng' }, { status: 401 })
    }
    return HttpResponse.json({
      message: 'Đăng nhập thành công',
      data: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user,
      },
    })
  }),

  http.post(`${API_URL}/logout`, () => {
    return HttpResponse.json({ message: 'Đăng xuất thành công' })
  }),

  http.post(`${API_URL}/refresh-access-token`, () => {
    return HttpResponse.json({
      message: 'Refresh token thành công',
      data: { access_token: 'mock-new-access-token' },
    })
  }),
]

export default authHandlers
