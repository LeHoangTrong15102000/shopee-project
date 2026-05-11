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

  http.get(`${API_URL}/admin/checkin/users`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '10')
    return HttpResponse.json({
      message: 'Success',
      data: {
        data: [
          { _id: 'user-1', user_id: 'user-1', user_name: 'Nguyen Van A', user_email: 'a@example.com', current_streak: 7, longest_streak: 14, total_checkins: 30, total_points: 500, last_checkin_date: '2024-01-15T08:00:00.000Z' },
          { _id: 'user-2', user_id: 'user-2', user_name: 'Tran Thi B', user_email: 'b@example.com', current_streak: 3, longest_streak: 10, total_checkins: 15, total_points: 250, last_checkin_date: '2024-01-15T09:00:00.000Z' },
        ],
        pagination: { page, limit, total: 2, page_size: 1 },
      },
    })
  }),

  http.get(`${API_URL}/admin/checkin/leaderboard`, () => {
    return HttpResponse.json({
      message: 'Success',
      data: [
        { _id: 'lb-1', user_id: 'user-1', user_name: 'Nguyen Van A', user_email: 'a@example.com', current_streak: 7, longest_streak: 14, total_checkins: 30, rank: 1 },
        { _id: 'lb-2', user_id: 'user-2', user_name: 'Tran Thi B', user_email: 'b@example.com', current_streak: 3, longest_streak: 10, total_checkins: 15, rank: 2 },
      ],
    })
  }),

  http.get(`${API_URL}/admin/checkin/daily-stats`, () => {
    return HttpResponse.json({
      message: 'Success',
      data: [
        { date: '2024-01-15', count: 42 },
        { date: '2024-01-14', count: 38 },
        { date: '2024-01-13', count: 35 },
      ],
    })
  }),
]

export default checkinHandlers
