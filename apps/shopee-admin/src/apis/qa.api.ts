import http from 'src/utils/http'
import type { SuccessResponse, QAQuestion, QAAnswer } from 'src/types'

interface QuestionListParams {
  page?: number
  limit?: number
  sort_by?: string
  order?: string
  product_id?: string
  unanswered?: string
}

interface QuestionListResponse {
  questions: QAQuestion[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface QAStats {
  total_questions: number
  total_answers: number
  unanswered_questions: number
}

const qaApi = {
  getQuestions: (params?: QuestionListParams) =>
    http.get<SuccessResponse<QuestionListResponse>>('admin/qa/questions', { params }),

  getQAStats: () => http.get<SuccessResponse<QAStats>>('admin/qa/stats'),

  deleteQuestion: (id: string) => http.delete<SuccessResponse<null>>(`admin/qa/questions/${id}`),

  deleteAnswer: (questionId: string, answerId: string) =>
    http.delete<SuccessResponse<null>>(`admin/qa/questions/${questionId}/answers/${answerId}`),
}

export default qaApi
export type { QAStats, QuestionListResponse, QAAnswer }
