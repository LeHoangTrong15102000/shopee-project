import { http, HttpResponse } from 'msw'
import { API_URL } from './msw-utils'

const mockConversations = [
  {
    _id: 'conv-001',
    user: { _id: 'user-1', name: 'Nguyen Van A', email: 'a@example.com' },
    messages: [
      { _id: 'msg-1', sender: 'user-1', sender_type: 'user', content: 'Hello', createdAt: '2024-01-01T10:00:00.000Z' },
      { _id: 'msg-2', sender: 'admin-1', sender_type: 'admin', content: 'Hi, how can I help?', createdAt: '2024-01-01T10:01:00.000Z' },
    ],
    message_count: 2,
    status: 'open',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:01:00.000Z',
  },
  {
    _id: 'conv-002',
    user: { _id: 'user-2', name: 'Tran Thi B', email: 'b@example.com' },
    messages: [],
    message_count: 0,
    status: 'closed',
    createdAt: '2024-01-02T08:00:00.000Z',
    updatedAt: '2024-01-02T08:00:00.000Z',
  },
]

const conversationsHandlers = [
  http.get(`${API_URL}/admin/conversations`, () => {
    return HttpResponse.json({
      message: 'Success',
      data: {
        conversations: mockConversations,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      },
    })
  }),

  http.get(`${API_URL}/admin/conversations/:id`, ({ params }) => {
    const conv = mockConversations.find((c) => c._id === params.id)
    if (!conv) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ message: 'Success', data: conv })
  }),
]

export default conversationsHandlers
