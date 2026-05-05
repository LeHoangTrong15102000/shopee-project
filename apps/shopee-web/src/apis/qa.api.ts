import { ProductQuestion, QAListConfig } from 'src/types/qa.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const qaApi = {
  // Lấy danh sách câu hỏi của sản phẩm
  getQuestions: (params: QAListConfig) => {
    return http.get<
      SuccessResponseApi<{
        questions: ProductQuestion[]
        pagination: { page: number; limit: number; total: number }
      }>
    >('/qa/questions', { params })
  },

  // Đặt câu hỏi mới
  askQuestion: (body: { product_id: string; question: string }) => {
    return http.post<SuccessResponseApi<ProductQuestion>>('/qa/questions', body)
  },

  // Trả lời câu hỏi
  answerQuestion: (questionId: string, body: { answer: string }) => {
    return http.post<SuccessResponseApi<ProductQuestion>>(
      `/qa/questions/${questionId}/answers`,
      body,
    )
  },

  // Like câu hỏi
  likeQuestion: (questionId: string) => {
    return http.post<SuccessResponseApi<{ likes_count: number }>>(
      `/qa/questions/${questionId}/like`,
    )
  },

  // Like câu trả lời
  likeAnswer: (questionId: string, answerId: string) => {
    return http.post<SuccessResponseApi<{ likes_count: number }>>(
      `/qa/questions/${questionId}/answers/${answerId}/like`,
    )
  },
}

export default qaApi
