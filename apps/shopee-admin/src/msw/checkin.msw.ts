import { http, HttpResponse } from 'msw'
import { API_URL } from './msw-utils'

const mockCheckinStats = {
  total_today: 42,
  active_streaks: 15,
  recent_activity: [
    {
      _id: 'checkin-1',
      user: { _id: 'user-1', name: 'Nguyen Van A', email: 'a@example.com' },
      streak: 7,
      points_earned: 50,
      createdAt: '2024-01-15T08:00:00.000Z',
    },
    {
      _id: 'checkin-2',
      user: { _id: 'user-2', name: 'Tran Thi B', email: 'b@example.com' },
      streak: 3,
      points_earned: 30,
      createdAt: '2024-01-15T09:00:00.000Z',
    },
  ],
}

const checkinHandlers = [
  http.get(`${API_URL}/admin/checkin`, () => {
    return HttpResponse.json({ message: 'Success', data: mockCheckinStats })
  }),
]

export default checkinHandlers
