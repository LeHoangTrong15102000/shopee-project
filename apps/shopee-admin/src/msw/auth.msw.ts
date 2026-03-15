import { http, HttpResponse } from 'msw';
import { mockUsers } from './data/users.mock';
import { API_URL } from './msw-utils';

const authHandlers = [
  http.post(`${API_URL}/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'wrong@email.com') {
      return HttpResponse.json({ message: 'Email hoặc mật khẩu không đúng' }, { status: 401 });
    }
    const adminUser = mockUsers.find((u) => u.roles.includes('Admin')) ?? mockUsers[0];
    return HttpResponse.json({
      message: 'Đăng nhập thành công',
      data: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: adminUser,
      },
    });
  }),

  http.post(`${API_URL}/logout`, () => {
    return HttpResponse.json({ message: 'Đăng xuất thành công' });
  }),

  http.post(`${API_URL}/refresh-access-token`, () => {
    return HttpResponse.json({
      message: 'Refresh token thành công',
      data: { access_token: 'mock-new-access-token' },
    });
  }),
];

export default authHandlers;
