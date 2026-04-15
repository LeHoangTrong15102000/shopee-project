import { http, HttpResponse } from 'msw'
import {
  mockProductAnalytics,
  mockCategoryStats,
  mockChatbotAnalytics,
} from './data/analytics.mock'
import { API_URL } from './msw-utils'

const analyticsHandlers = [
  http.get(`${API_URL}/admin/products/analytics/top-selling`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockProductAnalytics })
  }),

  http.get(`${API_URL}/admin/products/analytics/top-viewed`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockProductAnalytics })
  }),

  http.get(`${API_URL}/admin/products/analytics/top-rated`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockProductAnalytics })
  }),

  http.get(`${API_URL}/admin/products/analytics/by-category`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockCategoryStats })
  }),

  http.get(`${API_URL}/admin/analytics/chatbot-overview`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockChatbotAnalytics })
  }),

  http.get(`${API_URL}/admin/analytics/chatbot-performance`, () => {
    return HttpResponse.json({
      message: 'Thành công',
      data: [
        {
          date: '2024-01-01',
          conversationCount: 50,
          totalMessages: 250,
          uniqueUserCount: 30,
          avgResponseTime: 2.5,
        },
        {
          date: '2024-01-02',
          conversationCount: 65,
          totalMessages: 320,
          uniqueUserCount: 40,
          avgResponseTime: 2.3,
        },
      ],
    })
  }),
]

export default analyticsHandlers
