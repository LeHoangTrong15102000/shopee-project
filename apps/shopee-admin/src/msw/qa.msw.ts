import { http, HttpResponse } from 'msw'
import { mockQuestions, mockQAStats } from './data/qa.mock'
import { API_URL } from './msw-utils'

const qaHandlers = [
  http.get(`${API_URL}/admin/qa/questions`, () => {
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        questions: mockQuestions,
        pagination: { page: 1, limit: 50, total: mockQuestions.length, totalPages: 1 },
      },
    })
  }),

  http.get(`${API_URL}/admin/qa/stats`, () => {
    return HttpResponse.json({ message: 'Thành công', data: mockQAStats })
  }),

  http.delete(`${API_URL}/admin/qa/questions/:id`, () => {
    return HttpResponse.json({ message: 'Xóa câu hỏi thành công', data: null })
  }),

  http.delete(`${API_URL}/admin/qa/questions/:questionId/answers/:answerId`, () => {
    return HttpResponse.json({ message: 'Xóa câu trả lời thành công', data: null })
  }),
]

export default qaHandlers
